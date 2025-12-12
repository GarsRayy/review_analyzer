from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Review
from transformers import pipeline
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Initialize AI Models
print("Loading Hugging Face model...")
sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
gemini_model = genai.GenerativeModel('gemini-pro')

# Create tables
with app.app_context():
    db.create_all()
    print("Database tables created!")

def analyze_sentiment(text):
    """Analyze sentiment using Hugging Face"""
    try:
        result = sentiment_analyzer(text[:512])[0]  # Limit to 512 tokens
        
        label = result['label']
        score = result['score']
        
        # Convert to our format
        if label == 'POSITIVE':
            sentiment = 'positive'
        elif label == 'NEGATIVE':
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        return sentiment, score
    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        return 'neutral', 0.5

def extract_key_points(text):
    """Extract key points using Gemini"""
    try:
        prompt = f"""Analyze this product review and extract 3-5 key points in bullet format.
Be concise and focus on the most important aspects mentioned.

Review: {text}

Key Points:"""
        
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Key points extraction error: {e}")
        return "Could not extract key points"

@app.route('/api/analyze-review', methods=['POST'])
def analyze_review():
    """Analyze a new product review"""
    try:
        data = request.get_json()
        
        if not data or 'product_name' not in data or 'review_text' not in data:
            return jsonify({
                'error': 'Missing required fields: product_name and review_text'
            }), 400
        
        product_name = data['product_name']
        review_text = data['review_text']
        
        if len(review_text.strip()) < 10:
            return jsonify({
                'error': 'Review text too short (minimum 10 characters)'
            }), 400
        
        # Analyze sentiment
        sentiment, sentiment_score = analyze_sentiment(review_text)
        
        # Extract key points
        key_points = extract_key_points(review_text)
        
        # Save to database
        review = Review(
            product_name=product_name,
            review_text=review_text,
            sentiment=sentiment,
            sentiment_score=float(sentiment_score),
            key_points=key_points
        )
        
        db.session.add(review)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': review.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    """Get all reviews"""
    try:
        reviews = Review.query.order_by(Review.created_at.desc()).all()
        return jsonify({
            'success': True,
            'data': [review.to_dict() for review in reviews]
        }), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Product Review Analyzer API is running'
    }), 200

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, port=8080)