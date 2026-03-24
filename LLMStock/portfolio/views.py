from rest_framework import status, permissions, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from .models import Portfolio
from .serializers import PortfolioSerializer
from stocks.models import Stock
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from .models import Portfolio, PortfolioGroup
from .serializers import PortfolioSerializer, PortfolioGroupSerializer
from stocks.models import Stock

class PortfolioGroupListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Auto-create sector portfolios if they don't exist
        sectors = [
            "Nifty Auto", "Nifty Bank", "Nifty Commodities", "Nifty CPSE",
            "Nifty Energy", "Nifty FMCG", "Nifty IT", "Nifty Media",
            "Nifty Metal", "Nifty MNC", "Nifty Pharma", "Nifty PSE",
            "Nifty PSU Bank", "Nifty Realty"
        ]
        for sector in sectors:
            PortfolioGroup.objects.get_or_create(
                user=request.user,
                name=sector,
                group_type='SECTOR'
            )
        
        groups = PortfolioGroup.objects.filter(user=request.user)
        serializer = PortfolioGroupSerializer(groups, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PortfolioGroupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, group_type='CUSTOM')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PortfolioListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        group_id = request.query_params.get('group_id')
        if group_id:
            portfolios = Portfolio.objects.filter(user=request.user, group_id=group_id)
        else:
            portfolios = Portfolio.objects.filter(user=request.user)
        serializer = PortfolioSerializer(portfolios, many=True)
        return Response(serializer.data)

class PortfolioAddView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        group_id = request.data.get('group_id')
        group = None
        if group_id:
            group = get_object_or_404(PortfolioGroup, id=group_id, user=request.user)

        serializer = PortfolioSerializer(data=request.data)
        if serializer.is_valid():
            stock = serializer.validated_data['stock']
            portfolio, created = Portfolio.objects.get_or_create(
                user=request.user, 
                stock=stock,
                group=group,
                defaults={
                    'quantity': serializer.validated_data['quantity'],
                    'purchase_price': serializer.validated_data['purchase_price']
                }
            )
            if not created:
                total_cost = (portfolio.quantity * portfolio.purchase_price) + \
                             (serializer.validated_data['quantity'] * serializer.validated_data['purchase_price'])
                portfolio.quantity += serializer.validated_data['quantity']
                portfolio.purchase_price = total_cost / portfolio.quantity
                portfolio.save()
            
            return Response(PortfolioSerializer(portfolio).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PortfolioRemoveView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        symbol = request.data.get('symbol')
        group_id = request.data.get('group_id')
        if not symbol:
            return Response({"error": "Stock symbol required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if group_id:
            portfolio = get_object_or_404(Portfolio, user=request.user, stock__symbol=symbol, group_id=group_id)
        else:
            portfolio = get_object_or_404(Portfolio, user=request.user, stock__symbol=symbol)
            
        portfolio.delete()
        return Response({"message": f"Removed {symbol} from portfolio."}, status=status.HTTP_204_NO_CONTENT)

from django.http import HttpResponse
from django.template.loader import render_to_string
try:
    from weasyprint import HTML
except Exception:
    HTML = None
from datetime import datetime

class PortfolioAnalysisView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        portfolios = Portfolio.objects.filter(user=request.user)
        if not portfolios.exists():
            return Response({"error": "No holdings found for analysis."}, status=status.HTTP_404_NOT_FOUND)

        # Convert to DataFrame for processing
        data = []
        for p in portfolios:
            data.append({
                'symbol': p.stock.symbol,
                'quantity': p.quantity,
                'purchase_price': float(p.purchase_price),
                'current_price': float(p.stock.current_price) if p.stock.current_price else 0,
                'pe_ratio': float(p.stock.pe_ratio) if p.stock.pe_ratio else 0,
                'market_cap': float(p.stock.market_cap) if p.stock.market_cap else 0,
                'sector': p.stock.sector or 'Unknown'
            })
        
        df = pd.DataFrame(data)
        df['current_value'] = df['quantity'] * df['current_price']
        df['weight'] = df['current_value'] / df['current_value'].sum()

        # 1. Clustering (K-Means) based on PE and Market Cap
        # Prepare features for clustering
        features = df[['pe_ratio', 'market_cap']].copy()
        # Handle zeros/NaNs for log transformation if needed, or just scale
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(features)
        
        n_clusters = min(len(df), 3) # Max 3 clusters for small portfolios
        kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
        df['cluster'] = kmeans.fit_predict(scaled_features)

        # 2. Summary Stats
        total_investment = (df['quantity'] * df['purchase_price']).sum()
        total_current_value = df['current_value'].sum()
        total_profit_loss = total_current_value - total_investment
        total_return_pct = (total_profit_loss / total_investment * 100) if total_investment > 0 else 0

        # 3. Sector Distribution
        sector_dist = df.groupby('sector')['weight'].sum().to_dict()

        # 4. Growth/Value Logic (Simple heuristic: Low PE = Value, High PE = Growth)
        # Using median PE of portfolio as threshold
        median_pe = df['pe_ratio'].median()
        df['type'] = np.where(df['pe_ratio'] > median_pe, 'Growth', 'Value')
        type_dist = df.groupby('type')['weight'].sum().to_dict()

        analysis = {
            'summary': {
                'total_investment': total_investment,
                'total_current_value': total_current_value,
                'total_profit_loss': total_profit_loss,
                'total_return_pct': total_return_pct,
            },
            'clusters': df[['symbol', 'cluster']].to_dict(orient='records'),
            'sector_distribution': sector_dist,
            'style_distribution': type_dist,
            'pe_distribution': {
                'min': df['pe_ratio'].min(),
                'max': df['pe_ratio'].max(),
                'avg': df['pe_ratio'].mean()
            },
            'benchmark_comparison': {
                'portfolio_return': total_return_pct,
                'benchmark_name': 'Nifty 50 / S&P 500',
                'benchmark_return': 12.5 # Mock benchmark for now
            }
        }

        return Response(analysis)

class PortfolioPDFReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if HTML is None:
            return Response({"error": "PDF generation is not configured on this server. (Missing GTK+/WeasyPrint dependencies)"}, status=status.HTTP_501_NOT_IMPLEMENTED)
        portfolios = Portfolio.objects.filter(user=request.user)
        if not portfolios.exists():
            return Response({"error": "No holdings found for report."}, status=status.HTTP_404_NOT_FOUND)

        total_investment = sum(p.quantity * p.purchase_price for p in portfolios)
        total_current_value = sum(p.current_value for p in portfolios)
        total_pl = total_current_value - total_investment
        
        context = {
            'user': request.user,
            'portfolios': portfolios,
            'total_investment': total_investment,
            'total_current_value': total_current_value,
            'total_pl': total_pl,
            'date': datetime.now().strftime('%Y-%m-%d %H:%M')
        }
        
        html_string = render_to_string('portfolio/report_pdf.html', context)
        html = HTML(string=html_string)
        pdf = html.write_pdf()
        
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="portfolio_report.pdf"'
        return response
