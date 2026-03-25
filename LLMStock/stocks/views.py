from rest_framework import generics, filters, views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Stock
from .serializers import StockSerializer
from rest_framework.pagination import PageNumberPagination
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .utils import get_stock_details, calculate_technical_indicators, get_linear_forecast, get_advanced_forecast
import yfinance as yf
import numpy as np

class StockPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class StockListView(generics.ListAPIView):
    queryset = Stock.objects.all().order_by('symbol')
    serializer_class = StockSerializer
    pagination_class = StockPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['symbol', 'name', 'sector']
    ordering_fields = ['current_price', 'market_cap', 'pe_ratio']

    def get_queryset(self):
        queryset = super().get_queryset()
        sector = self.request.query_params.get('sector')
        market = self.request.query_params.get('market')
        if sector:
            queryset = queryset.filter(sector__iexact=sector)
        if market:
            queryset = queryset.filter(market__iexact=market)
        return queryset

class StockForecastView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        stock = get_object_or_404(Stock, pk=pk)
        model_type = request.query_params.get('model', 'linear')
        timeframe = request.query_params.get('timeframe', 'daily')
        horizon = int(request.query_params.get('horizon', 30))
        
        ticker = yf.Ticker(stock.symbol)
        hist = ticker.history(period="2y")
        
        forecast = get_advanced_forecast(hist, model_type, timeframe, horizon)
        return Response(forecast)

class StockDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        stock = get_object_or_404(Stock, pk=pk)
        details = get_stock_details(stock.symbol)
        if not details:
            return Response({"error": "Failed to fetch detailed data."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(details)

from django.http import HttpResponse
from django.template.loader import render_to_string
try:
    from weasyprint import HTML
except Exception:
    HTML = None
import csv
import io

from datetime import datetime

class StockSentimentView(views.APIView):
    """
    Current sentiment score (mocked).
    """
    @method_decorator(cache_page(60 * 30)) # Cache for 30 minutes
    def get(self, request, pk):
        # In a real app, this would query a sentiment analysis service or model
        score = round(np.random.uniform(0.1, 0.9), 2)
        return Response({
            "symbol": get_object_or_404(Stock, pk=pk).symbol,
            "sentiment_score": score,
            "sentiment_label": "Positive" if score > 0.6 else "Neutral" if score > 0.4 else "Negative"
        })

class StockCSVExportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        stock = get_object_or_404(Stock, pk=pk)
        details = get_stock_details(stock.symbol)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{stock.symbol}_report.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Field', 'Value'])
        writer.writerow(['Symbol', stock.symbol])
        writer.writerow(['Name', stock.name])
        writer.writerow(['Price', stock.current_price])
        writer.writerow(['Sector', stock.sector])
        writer.writerow(['PE Ratio', stock.pe_ratio])
        writer.writerow(['Market Cap', stock.market_cap])
        
        if details and 'indicators' in details:
            writer.writerow([])
            writer.writerow(['Technical Indicators'])
            for key, val in details['indicators'].items():
                writer.writerow([key.upper(), val])
                
        return response

class StockPDFExportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        if HTML is None:
            return Response({"error": "PDF generation is not configured on this server. (Missing GTK+/WeasyPrint dependencies)"}, status=status.HTTP_501_NOT_IMPLEMENTED)
        stock = get_object_or_404(Stock, pk=pk)
        details = get_stock_details(stock.symbol)
        
        context = {
            'stock': stock,
            'details': details,
            'date': datetime.now().strftime('%Y-%m-%d %H:%M')
        }
        
        html_string = render_to_string('stocks/report_pdf.html', context)
        html = HTML(string=html_string)
        pdf = html.write_pdf()
        
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{stock.symbol}_report.pdf"'
        return response
