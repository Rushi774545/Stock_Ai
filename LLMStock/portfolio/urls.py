from django.urls import path
from .views import (
    PortfolioListView, 
    PortfolioAddView, 
    PortfolioRemoveView, 
    PortfolioAnalysisView,
    PortfolioPDFReportView,
    PortfolioGroupListView
)

urlpatterns = [
    path('', PortfolioListView.as_view(), name='portfolio-list'),
    path('groups/', PortfolioGroupListView.as_view(), name='portfolio-groups'),
    path('add/', PortfolioAddView.as_view(), name='portfolio-add'),
    path('remove/', PortfolioRemoveView.as_view(), name='portfolio-remove'),
    path('analysis/', PortfolioAnalysisView.as_view(), name='portfolio-analysis'),
    path('export-pdf/', PortfolioPDFReportView.as_view(), name='portfolio-export-pdf'),
]
