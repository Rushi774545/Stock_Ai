from django.core.management.base import BaseCommand
from chatbot.rag_utils import rag_service

class Command(BaseCommand):
    help = 'Index stock data into ChromaDB for RAG'

    def handle(self, *args, **kwargs):
        self.stdout.write("Indexing stocks into ChromaDB...")
        try:
            rag_service.index_stocks()
            self.stdout.write(self.style.SUCCESS("Successfully indexed stocks."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to index stocks: {str(e)}"))
