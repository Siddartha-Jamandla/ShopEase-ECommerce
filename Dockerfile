FROM python:3.11-slim
WORKDIR /app
COPY . .
# Fresh DB on each deploy (don't bake local sqlite into image)
RUN rm -f backend/*.db backend/__pycache__ -r 2>/dev/null; true
EXPOSE 8000
CMD ["python", "backend/app.py"]
