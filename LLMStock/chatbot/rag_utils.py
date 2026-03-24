import os
import chromadb
import google.generativeai as genai
from stocks.models import Stock
from portfolio.models import Portfolio

class RAGService:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        self.persist_directory = os.path.join(os.getcwd(), 'chroma_db')
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.collection = self.client.get_or_create_collection(name="stock_data")

    def get_embedding(self, text):
        """Get embedding for a text using Gemini API."""
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']

    def index_stocks(self):
        """Index stock information and AI analysis into ChromaDB."""
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
            self.collection.upsert(
                documents=[text],
                embeddings=[embedding],
                metadatas=[{"symbol": stock.symbol, "type": "stock"}],
                ids=[f"stock_{stock.symbol}"]
            )

    def index_user_portfolio(self, user):
        """Index user portfolio summary into ChromaDB."""
        holdings = Portfolio.objects.filter(user=user)
        if holdings.exists():
            summary = f"User {user.username} has holdings in: " + ", ".join([f"{h.stock.symbol} ({h.quantity} shares)" for h in holdings])
            embedding = self.get_embedding(summary)
            self.collection.upsert(
                documents=[summary],
                embeddings=[embedding],
                metadatas=[{"user_id": user.id, "type": "portfolio"}],
                ids=[f"portfolio_user_{user.id}"]
            )

    def query_rag(self, query, user=None):
        """Perform RAG using ChromaDB and direct Gemini API calls."""
        # 1. Get embedding for the query
        query_embedding = self.get_embedding(query)
        
        # 2. Search relevant docs in ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=3
        )
        
        context = "\n".join(results['documents'][0]) if results['documents'] else ""
        
        # 3. Construct prompt and get response from Gemini
        system_prompt = "You are a helpful stock market assistant. Use the following context to answer the user's question. If you don't know, say so."
        if not user or not user.is_authenticated:
            system_prompt += " Since the user is not logged in, only answer general market questions."
            
        full_prompt = f"{system_prompt}\n\nContext:\n{context}\n\nUser Question: {query}"
        
        response = self.model.generate_content(full_prompt)
        return response.text

rag_service = RAGService()
