module.exports = {
  apps: [
    {
      name: 'stock-backend',
      script: 'venv/bin/python3',
      args: '-m gunicorn --workers 3 --bind 0.0.0.0:8000 stock_platform.wsgi:application',
      cwd: './LLMStock',
      env: {
        DEBUG: 'False',
        PYTHONPATH: '.',
      },
    },
  ],
};
