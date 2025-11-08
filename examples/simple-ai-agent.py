"""
Simple AI Agent Integration Example (Python)
Demonstrates how an AI agent can use the AP2Stellar API to make payments
"""

import os
import time
import uuid
import jwt
import requests
from datetime import datetime, timedelta
from typing import Dict, Optional, Any


class AIAgentPaymentService:
    """AI Agent Payment Service for AP2Stellar integration"""

    def __init__(self, agent_id: str, jwt_secret: str, api_url: str = "http://localhost:3000"):
        self.agent_id = agent_id
        self.jwt_secret = jwt_secret
        self.api_url = api_url

    def generate_auth_token(self) -> str:
        """Generate JWT token for authentication"""
        payload = {
            "agent_id": self.agent_id,
            "permissions": ["payment:send", "payment:receive"],
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,  # 1 hour expiry
        }
        return jwt.encode(payload, self.jwt_secret, algorithm="HS256")

    def get_quote(self, source_currency: str, destination_currency: str, amount: str) -> Dict:
        """Get exchange rate quote"""
        print(f"\n🔍 Getting quote: {amount} {source_currency} → {destination_currency}")

        try:
            response = requests.get(
                f"{self.api_url}/api/v1/quote",
                params={
                    "source_currency": source_currency,
                    "destination_currency": destination_currency,
                    "source_amount": amount,
                },
            )
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "success":
                quote = data["data"]
                print(f"✅ Quote received:")
                print(f"   Rate: 1 {quote['source_currency']} = {quote['exchange_rate']} {quote['destination_currency']}")
                print(f"   You'll receive: {quote['estimated_destination_amount']} {quote['destination_currency']}")
                print(f"   Estimated fee: {quote['estimated_fee']} XLM")
                return quote
            else:
                raise Exception(data.get("error", {}).get("message", "Failed to get quote"))

        except Exception as e:
            print(f"❌ Quote error: {e}")
            raise

    def send_payment(self, payment_details: Dict) -> Dict:
        """Send a payment"""
        print(f"\n💸 Sending payment: {payment_details['amount']} {payment_details['currency']}")

        payment_intent = {
            "intent_id": str(uuid.uuid4()),
            "amount": payment_details["amount"],
            "currency": payment_details["currency"],
            "recipient": {
                "agent_id": payment_details["recipient_agent_id"],
                "payment_address": payment_details["recipient_address"],
                "destination_currency": payment_details.get("destination_currency", payment_details["currency"]),
            },
            "sender": {
                "agent_id": self.agent_id,
                "authorization_token": self.generate_auth_token(),
            },
            "metadata": payment_details.get("metadata", {}),
        }

        if "callback_url" in payment_details:
            payment_intent["callback_url"] = payment_details["callback_url"]

        try:
            response = requests.post(
                f"{self.api_url}/api/v1/ap2/payment",
                json=payment_intent,
                headers={"Content-Type": "application/json"},
            )

            data = response.json()

            if data.get("status") == "completed":
                print("✅ Payment successful!")
                print(f"   TX Hash: {data['transaction_details']['transaction_hash']}")
                print(f"   Sent: {data['amount']['sent']} {data['amount']['currency_sent']}")
                print(f"   Received: {data['amount']['received']} {data['amount']['currency_received']}")
                print(f"   Network Fee: {data['fees']['network_fee']} XLM")
                print(f"   Settlement Time: {data['transaction_details']['settlement_time_seconds']}s")

                return {
                    "success": True,
                    "intent_id": payment_intent["intent_id"],
                    "confirmation": data,
                }
            else:
                print(f"❌ Payment failed: {data.get('error', {}).get('message')}")
                return {
                    "success": False,
                    "intent_id": payment_intent["intent_id"],
                    "error": data.get("error"),
                }

        except Exception as e:
            print(f"❌ Payment error: {e}")
            raise

    def check_payment_status(self, intent_id: str) -> Optional[Dict]:
        """Check payment status"""
        print(f"\n🔍 Checking payment status for intent: {intent_id}")

        try:
            response = requests.get(f"{self.api_url}/api/v1/ap2/payment/{intent_id}")

            if response.status_code == 404:
                print("   Payment not found")
                return None

            data = response.json()
            print(f"   Status: {data['status']}")
            if data.get("transaction_details"):
                print(f"   TX Hash: {data['transaction_details']['transaction_hash']}")

            return data

        except Exception as e:
            print(f"❌ Status check error: {e}")
            raise

    def evaluate_payment(self, payment_request: Dict) -> Dict:
        """AI Agent Decision Making: Should I make this payment?"""
        print("\n🤖 AI Agent evaluating payment request...")

        # Step 1: Get a quote to understand the exchange rate
        quote = self.get_quote(
            payment_request["currency"],
            payment_request.get("destination_currency", payment_request["currency"]),
            payment_request["amount"],
        )

        # Step 2: AI logic to evaluate if this is a good payment
        expected_receive = float(quote["estimated_destination_amount"])
        fee = float(quote["estimated_fee"])

        print("\n💭 AI Analysis:")
        print(f"   Expected to receive: {expected_receive} {quote['destination_currency']}")
        print(f"   Network fee: {fee} XLM")

        # Simple AI decision logic
        if fee > 1.0:
            print("   ⚠️  Warning: High network fee")

        if expected_receive < float(payment_request["amount"]) * 0.95:
            print("   ⚠️  Warning: Exchange rate may not be favorable (>5% loss)")

        print("   ✅ Payment approved by AI agent")

        return {
            "approved": True,
            "quote": quote,
            "reasoning": "Payment within acceptable parameters",
        }


def demonstrate_ai_agent_integration():
    """Example usage scenarios"""
    print("═" * 60)
    print("🤖 AI Agent Payment Integration Demo (Python)")
    print("═" * 60)

    # Initialize AI Agent
    agent = AIAgentPaymentService(
        agent_id="python-ai-agent-001",
        jwt_secret=os.getenv("AP2_JWT_SECRET", "c5fedbfa23a88adfd97ade7b37c57fe323ecbd06b750da25e493ebeb05299d18"),
        api_url=os.getenv("AP2_STELLAR_URL", "http://localhost:3000"),
    )

    # Scenario 1: AI Agent makes a payment decision
    print("\n📋 Scenario 1: AI Agent Making a Payment Decision")
    print("─" * 60)

    payment_request = {
        "amount": "15.00",
        "currency": "XLM",
        "destination_currency": "USDC",
        "recipient_agent_id": "python-merchant-agent",
        "recipient_address": "stellar:GDPSW6ONJR7QJEQXB2V4TBRTSJ4ALSSMCMI6GVAN2XMNVKDGV7HE4K63",
        "metadata": {
            "purpose": "AI model training credits",
            "service": "Claude API Usage",
        },
    }

    # AI Agent evaluates the payment
    evaluation = agent.evaluate_payment(payment_request)

    if evaluation["approved"]:
        # AI Agent executes the payment
        result = agent.send_payment(payment_request)

        if result["success"]:
            print("\n🎉 AI Agent successfully completed payment!")

            # AI Agent can track the payment
            time.sleep(2)
            agent.check_payment_status(result["intent_id"])

    # Scenario 2: Batch quote analysis
    print("\n\n📋 Scenario 2: AI Agent Analyzing Multiple Currency Pairs")
    print("─" * 60)

    currency_pairs = [
        {"from": "XLM", "to": "USDC", "amount": "50"},
        {"from": "USDC", "to": "XLM", "amount": "25"},
    ]

    for pair in currency_pairs:
        agent.get_quote(pair["from"], pair["to"], pair["amount"])

    print("\n" + "═" * 60)
    print("✅ AI Agent Integration Demo Complete!")
    print("═" * 60 + "\n")


if __name__ == "__main__":
    demonstrate_ai_agent_integration()
