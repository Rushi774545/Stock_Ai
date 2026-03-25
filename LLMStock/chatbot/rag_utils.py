import os
import chromadb
import google.generativeai as google_genai
from stocks.models import Stock
from portfolio.models import Portfolio

class RAGService:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self._model = None
        self._client = None
        self._collection = None

    @property
    def model(self):
        if self._model is None and self.api_key:
            google_genai.configure(api_key=self.api_key)
            self._model = google_genai.GenerativeModel('gemini-1.5-flash')
        return self._model

    @property
    def collection(self):
        if self._collection is None:
            try:
                persist_directory = os.path.join(os.getcwd(), 'chroma_db')
                self._client = chromadb.PersistentClient(path=persist_directory)
                self._collection = self._client.get_or_create_collection(name="stock_data")
            except Exception as e:
                # Log or handle error (chromadb may fail on some systems)
                print(f"ChromaDB initialization failed: {e}")
                return None
        return self._collection

    def get_embedding(self, text):
        """Get embedding for a text using Gemini API."""
        if not self.api_key:
            return None
        try:
            result = google_genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception:
            return None

    def index_stocks(self):
        """Index stock information and AI analysis into ChromaDB."""
        if not self.collection:
            return
        stocks = Stock.objects.all().select_related('news_gold')
        for stock in stocks:
            news_gold = getattr(stock, 'news_gold', None)
            gold_text = f" AI Recommendation: {news_gold.recommendation}. Summary: {news_gold.summary}. Reasoning: {news_gold.reasoning}." if news_gold else ""
            
            text = (
                f"Symbol: {stock.symbol}, Name: {stock.name}, Sector: {stock.sector}, "
                f"Industry: {stock.industry}, Price: {stock.current_price}, "
                f"Change: {stock.change_pct}%, Volatility: {stock.volatility}%, "
                f"Volume: {stock.volume}, Market Cap: {stock.market_cap}, "
                f"PE Ratio: {stock.pe_ratio}.{gold_text}"
            )
            embedding = self.get_embedding(text)
            if embedding:
                self.collection.upsert(
                    documents=[text],
                    embeddings=[embedding],
                    metadatas=[{"symbol": stock.symbol, "type": "stock"}],
                    ids=[f"stock_{stock.symbol}"]
                )

    def index_user_portfolio(self, user):
        """Index user portfolio summary into ChromaDB."""
        if not self.collection:
            return
        holdings = Portfolio.objects.filter(user=user)
        if holdings.exists():
            summary = f"User {user.username} has holdings in: " + ", ".join([f"{h.stock.symbol} ({h.quantity} shares)" for h in holdings])
            embedding = self.get_embedding(summary)
            if embedding:
                self.collection.upsert(
                    documents=[summary],
                    embeddings=[embedding],
                    metadatas=[{"user_id": user.id, "type": "portfolio"}],
                    ids=[f"portfolio_user_{user.id}"]
                )

    def query_rag(self, query, user=None):
        """Perform RAG using ChromaDB and direct Gemini API calls."""
        if not self.collection or not self.model:
            return "RAG service not fully initialized."

        query_embedding = self.get_embedding(query)
        if not query_embedding:
            return "Could not generate embedding for query."

        # Filter by user or for public data
        where_filter = {"type": "stock"}
        if user and user.is_authenticated:
            where_filter = {
                "$or": [
                    {"type": "stock"},
                    {"user_id": user.id}
                ]
            }

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=5, # Increased results for better context
            where=where_filter
        )
        
        context = "\n".join(results['documents'][0]) if results['documents'] else ""
        
        # Construct prompt and get response from Gemini
        system_prompt = (
            "You are MORPHEUS, a helpful and friendly stock market assistant. "
            "Use the following context to answer the user's question. "
            "If you don't know the answer from the context, say so. "
            "Always be polite and provide clear, actionable information."
        )
        if not user or not user.is_authenticated:
            system_prompt += " The user is not logged in, so only answer general market questions and do not mention personal portfolios."
        else:
            system_prompt += f" The user is {user.username}. Use their portfolio information if relevant."
            
        full_prompt = f"{system_prompt}\n\nContext:\n{context}\n\nUser Question: {query}"
        
        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            return f"Error generating content: {e}"

rag_service = RAGService()
