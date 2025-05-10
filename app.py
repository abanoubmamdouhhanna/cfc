from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from openai import OpenAI
from typing import Dict, Any, Optional

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class Chatbot:
    """A class representing a chatbot that interacts with OpenAI's API."""
    
    def __init__(self) -> None:
        """Initialize the chatbot with default settings."""
        self.conversation_history: list[Dict[str, str]] = []
        self.max_history: int = 10

    def add_message(self, role: str, content: str) -> None:
        """
        Add a message to the conversation history.

        Args:
            role (str): The role of the message sender (e.g., 'user', 'assistant')
            content (str): The content of the message
        """
        self.conversation_history.append({"role": role, "content": content})
        if len(self.conversation_history) > self.max_history:
            self.conversation_history.pop(0)

    def get_response(self, user_input: str) -> str:
        """
        Get a response from the chatbot based on user input.

        Args:
            user_input (str): The user's input message

        Returns:
            str: The chatbot's response
        """
        self.add_message("user", user_input)
        
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=self.conversation_history,
                max_tokens=150
            )
            assistant_response = response.choices[0].message.content
            self.add_message("assistant", assistant_response)
            return assistant_response
        except Exception as e:
            return f"Error: {str(e)}"

# Create chatbot instance
chatbot = Chatbot()

@app.route("/api/chat", methods=["POST"])
def chat() -> Dict[str, Any]:
    """
    Handle chat requests from the frontend.

    Returns:
        Dict[str, Any]: JSON response containing the chatbot's response
    """
    data: Dict[str, Any] = request.get_json()
    user_message: str = data.get("message", "")
    
    if not user_message:
        return jsonify({"error": "No message provided"}), 400
    
    response: str = chatbot.get_response(user_message)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True) 