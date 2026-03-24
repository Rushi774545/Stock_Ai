from django.urls import path
from .views import (
    StockListView, 
    StockDetailView, 
    StockForecastView, 
    StockSentimentView,
    StockCSVExportView,
    StockPDFExportView
)

urlpatterns = [
    path('', StockListView.as_view(), name='stock-list'),
    path('<int:pk>/', StockDetailView.as_view(), name='stock-detail'),
    path('<int:pk>/forecast/', StockForecastView.as_view(), name='stock-forecast'),
    path('<int:pk>/sentiment/', StockSentimentView.as_view(), name='stock-sentiment'),
    path('<int:pk>/export-csv/', StockCSVExportView.as_view(), name='stock-export-csv'),
    path('<int:pk>/export-pdf/', StockPDFExportView.as_view(), name='stock-export-pdf'),
]
