from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'focolare-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7

# Create the main app
app = FastAPI(title="Focolare - Family Budget API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    family_id: Optional[str] = None
    role: str = "member"
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class FamilyCreate(BaseModel):
    name: str

class FamilyResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    members: List[dict]
    created_at: str

class FamilyInvite(BaseModel):
    email: EmailStr

class BankAccountCreate(BaseModel):
    name: str
    institution: str
    account_type: str  # checking, savings, credit
    balance: float = 0.0

class BankAccountResponse(BaseModel):
    id: str
    user_id: str
    family_id: str
    name: str
    institution: str
    account_type: str
    balance: float
    last_synced: Optional[str] = None
    is_connected: bool = True
    created_at: str

class TransactionCreate(BaseModel):
    account_id: Optional[str] = None
    amount: float
    description: str
    category: str
    date: Optional[str] = None
    is_expense: bool = True

class TransactionResponse(BaseModel):
    id: str
    account_id: Optional[str] = None
    family_id: str
    user_id: str
    amount: float
    description: str
    category: str
    icon: str
    date: str
    is_expense: bool
    created_at: str

class BudgetCreate(BaseModel):
    category: str
    amount: float
    month: str  # YYYY-MM format

class BudgetResponse(BaseModel):
    id: str
    family_id: str
    category: str
    amount: float
    spent: float
    month: str
    created_at: str

class NotificationSettingsUpdate(BaseModel):
    push_enabled: bool = True
    email_enabled: bool = False
    transaction_alerts: bool = True
    budget_alerts: bool = True

# ==================== CATEGORIES ====================

CATEGORIES = {
    "alimentari": {"icon": "ShoppingCart", "color": "#14532D"},
    "trasporti": {"icon": "Car", "color": "#EA580C"},
    "casa": {"icon": "Home", "color": "#EAB308"},
    "utenze": {"icon": "Zap", "color": "#78716C"},
    "salute": {"icon": "Heart", "color": "#DC2626"},
    "intrattenimento": {"icon": "Film", "color": "#7C3AED"},
    "ristoranti": {"icon": "UtensilsCrossed", "color": "#F97316"},
    "shopping": {"icon": "ShoppingBag", "color": "#EC4899"},
    "istruzione": {"icon": "GraduationCap", "color": "#0EA5E9"},
    "viaggi": {"icon": "Plane", "color": "#06B6D4"},
    "sport": {"icon": "Dumbbell", "color": "#10B981"},
    "abbonamenti": {"icon": "CreditCard", "color": "#6366F1"},
    "stipendio": {"icon": "Wallet", "color": "#22C55E"},
    "bonus": {"icon": "Gift", "color": "#F59E0B"},
    "altro": {"icon": "MoreHorizontal", "color": "#64748B"},
}

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token non valido")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utente non trovato")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token scaduto")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "family_id": None,
        "role": "member",
        "notification_settings": {
            "push_enabled": True,
            "email_enabled": False,
            "transaction_alerts": True,
            "budget_alerts": True
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    token = create_token(user_id)
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        family_id=user["family_id"],
        role=user["role"],
        created_at=user["created_at"]
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    
    token = create_token(user["id"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        family_id=user.get("family_id"),
        role=user.get("role", "member"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        family_id=user.get("family_id"),
        role=user.get("role", "member"),
        created_at=user["created_at"]
    )

# ==================== FAMILY ROUTES ====================

@api_router.post("/family", response_model=FamilyResponse)
async def create_family(data: FamilyCreate, user: dict = Depends(get_current_user)):
    if user.get("family_id"):
        raise HTTPException(status_code=400, detail="Fai già parte di una famiglia")
    
    family_id = str(uuid.uuid4())
    family = {
        "id": family_id,
        "name": data.name,
        "owner_id": user["id"],
        "members": [{"id": user["id"], "name": user["name"], "email": user["email"], "role": "owner"}],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.families.insert_one(family)
    await db.users.update_one({"id": user["id"]}, {"$set": {"family_id": family_id, "role": "owner"}})
    
    return FamilyResponse(**{k: v for k, v in family.items() if k != "_id"})

@api_router.get("/family", response_model=FamilyResponse)
async def get_family(user: dict = Depends(get_current_user)):
    if not user.get("family_id"):
        raise HTTPException(status_code=404, detail="Non fai parte di nessuna famiglia")
    
    family = await db.families.find_one({"id": user["family_id"]}, {"_id": 0})
    if not family:
        raise HTTPException(status_code=404, detail="Famiglia non trovata")
    
    return FamilyResponse(**family)

@api_router.post("/family/invite")
async def invite_member(data: FamilyInvite, user: dict = Depends(get_current_user)):
    if not user.get("family_id"):
        raise HTTPException(status_code=400, detail="Devi creare una famiglia prima")
    
    if user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Solo il proprietario può invitare membri")
    
    invited_user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not invited_user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    if invited_user.get("family_id"):
        raise HTTPException(status_code=400, detail="L'utente fa già parte di una famiglia")
    
    await db.users.update_one(
        {"id": invited_user["id"]},
        {"$set": {"family_id": user["family_id"], "role": "member"}}
    )
    
    await db.families.update_one(
        {"id": user["family_id"]},
        {"$push": {"members": {"id": invited_user["id"], "name": invited_user["name"], "email": invited_user["email"], "role": "member"}}}
    )
    
    return {"message": "Membro aggiunto con successo"}

@api_router.delete("/family/member/{member_id}")
async def remove_member(member_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Solo il proprietario può rimuovere membri")
    
    if member_id == user["id"]:
        raise HTTPException(status_code=400, detail="Non puoi rimuovere te stesso")
    
    await db.users.update_one({"id": member_id}, {"$set": {"family_id": None, "role": "member"}})
    await db.families.update_one({"id": user["family_id"]}, {"$pull": {"members": {"id": member_id}}})
    
    return {"message": "Membro rimosso"}

# ==================== BANK ACCOUNTS (MOCKED PLAID) ====================

@api_router.post("/bank-accounts", response_model=BankAccountResponse)
async def create_bank_account(data: BankAccountCreate, user: dict = Depends(get_current_user)):
    if not user.get("family_id"):
        raise HTTPException(status_code=400, detail="Devi creare una famiglia prima")
    
    account_id = str(uuid.uuid4())
    account = {
        "id": account_id,
        "user_id": user["id"],
        "family_id": user["family_id"],
        "name": data.name,
        "institution": data.institution,
        "account_type": data.account_type,
        "balance": data.balance,
        "last_synced": datetime.now(timezone.utc).isoformat(),
        "is_connected": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bank_accounts.insert_one(account)
    return BankAccountResponse(**{k: v for k, v in account.items() if k != "_id"})

@api_router.get("/bank-accounts", response_model=List[BankAccountResponse])
async def get_bank_accounts(user: dict = Depends(get_current_user)):
    if not user.get("family_id"):
        return []
    
    accounts = await db.bank_accounts.find({"family_id": user["family_id"]}, {"_id": 0}).to_list(100)
    return [BankAccountResponse(**acc) for acc in accounts]

@api_router.post("/bank-accounts/{account_id}/sync")
async def sync_bank_account(account_id: str, user: dict = Depends(get_current_user)):
    """MOCKED: Simulates Plaid sync by generating random transactions"""
    account = await db.bank_accounts.find_one({"id": account_id, "family_id": user.get("family_id")}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Conto non trovato")
    
    # Generate 3-5 mock transactions
    mock_transactions = []
    categories_list = list(CATEGORIES.keys())
    
    for i in range(random.randint(3, 5)):
        is_expense = random.random() > 0.2
        category = random.choice(categories_list[:12]) if is_expense else random.choice(["stipendio", "bonus"])
        amount = round(random.uniform(10, 200), 2) if is_expense else round(random.uniform(500, 3000), 2)
        
        descriptions = {
            "alimentari": ["Supermercato Conad", "Esselunga", "Lidl", "Carrefour"],
            "trasporti": ["Benzina ENI", "Autostrada", "Trenitalia", "ATM Milano"],
            "casa": ["Affitto", "Condominio", "Riparazioni"],
            "utenze": ["ENEL Luce", "Gas Italgas", "Acqua", "Internet TIM"],
            "salute": ["Farmacia", "Visita medica", "Dentista"],
            "intrattenimento": ["Netflix", "Cinema", "Spotify"],
            "ristoranti": ["Ristorante Da Mario", "Pizzeria Bella Napoli", "Bar caffè"],
            "shopping": ["Zara", "H&M", "Amazon"],
            "stipendio": ["Stipendio Gennaio", "Bonifico stipendio"],
            "bonus": ["Bonus aziendale", "Rimborso spese"],
        }
        
        desc_list = descriptions.get(category, ["Transazione"])
        description = random.choice(desc_list)
        
        days_ago = random.randint(0, 7)
        trans_date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
        
        transaction = {
            "id": str(uuid.uuid4()),
            "account_id": account_id,
            "family_id": user["family_id"],
            "user_id": user["id"],
            "amount": amount,
            "description": description,
            "category": category,
            "icon": CATEGORIES[category]["icon"],
            "date": trans_date,
            "is_expense": is_expense,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        mock_transactions.append(transaction)
    
    if mock_transactions:
        await db.transactions.insert_many(mock_transactions)
    
    # Update account balance and last_synced
    balance_change = sum(-t["amount"] if t["is_expense"] else t["amount"] for t in mock_transactions)
    new_balance = account["balance"] + balance_change
    
    await db.bank_accounts.update_one(
        {"id": account_id},
        {"$set": {"balance": new_balance, "last_synced": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "message": f"Sincronizzate {len(mock_transactions)} transazioni",
        "transactions_count": len(mock_transactions),
        "new_balance": new_balance
    }

@api_router.delete("/bank-accounts/{account_id}")
async def delete_bank_account(account_id: str, user: dict = Depends(get_current_user)):
    result = await db.bank_accounts.delete_one({"id": account_id, "family_id": user.get("family_id")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conto non trovato")
    return {"message": "Conto eliminato"}

# ==================== TRANSACTIONS ====================

@api_router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(data: TransactionCreate, user: dict = Depends(get_current_user)):
    if not user.get("family_id"):
        raise HTTPException(status_code=400, detail="Devi creare una famiglia prima")
    
    category_info = CATEGORIES.get(data.category, CATEGORIES["altro"])
    
    transaction = {
        "id": str(uuid.uuid4()),
        "account_id": data.account_id,
        "family_id": user["family_id"],
        "user_id": user["id"],
        "amount": data.amount,
        "description": data.description,
        "category": data.category,
        "icon": category_info["icon"],
        "date": data.date or datetime.now(timezone.utc).isoformat(),
        "is_expense": data.is_expense,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction)
    
    # Update account balance
    if data.account_id:
        balance_change = -data.amount if data.is_expense else data.amount
        await db.bank_accounts.update_one(
            {"id": data.account_id},
            {"$inc": {"balance": balance_change}}
        )
    
    return TransactionResponse(**{k: v for k, v in transaction.items() if k != "_id"})

@api_router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    category: Optional[str] = None,
    month: Optional[str] = None,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    if not user.get("family_id"):
        return []
    
    query = {"family_id": user["family_id"]}
    
    if category:
        query["category"] = category
    
    if month:
        # Filter by month (YYYY-MM format)
        start_date = f"{month}-01T00:00:00"
        if month[5:7] == "12":
            end_date = f"{int(month[:4])+1}-01-01T00:00:00"
        else:
            end_date = f"{month[:5]}{int(month[5:7])+1:02d}-01T00:00:00"
        query["date"] = {"$gte": start_date, "$lt": end_date}
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).to_list(limit)
    return [TransactionResponse(**t) for t in transactions]

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, user: dict = Depends(get_current_user)):
    transaction = await db.transactions.find_one({"id": transaction_id, "family_id": user.get("family_id")}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transazione non trovata")
    
    # Reverse balance change
    if transaction.get("account_id"):
        balance_change = transaction["amount"] if transaction["is_expense"] else -transaction["amount"]
        await db.bank_accounts.update_one(
            {"id": transaction["account_id"]},
            {"$inc": {"balance": balance_change}}
        )
    
    await db.transactions.delete_one({"id": transaction_id})
    return {"message": "Transazione eliminata"}

# ==================== BUDGETS ====================

@api_router.post("/budgets", response_model=BudgetResponse)
async def create_budget(data: BudgetCreate, user: dict = Depends(get_current_user)):
    if not user.get("family_id"):
        raise HTTPException(status_code=400, detail="Devi creare una famiglia prima")
    
    # Check if budget exists for this category/month
    existing = await db.budgets.find_one({
        "family_id": user["family_id"],
        "category": data.category,
        "month": data.month
    })
    
    if existing:
        # Update existing budget
        await db.budgets.update_one(
            {"id": existing["id"]},
            {"$set": {"amount": data.amount}}
        )
        existing["amount"] = data.amount
        return BudgetResponse(**{k: v for k, v in existing.items() if k != "_id"})
    
    budget = {
        "id": str(uuid.uuid4()),
        "family_id": user["family_id"],
        "category": data.category,
        "amount": data.amount,
        "spent": 0.0,
        "month": data.month,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.budgets.insert_one(budget)
    return BudgetResponse(**{k: v for k, v in budget.items() if k != "_id"})

@api_router.get("/budgets", response_model=List[BudgetResponse])
async def get_budgets(month: Optional[str] = None, user: dict = Depends(get_current_user)):
    if not user.get("family_id"):
        return []
    
    query = {"family_id": user["family_id"]}
    if month:
        query["month"] = month
    
    budgets = await db.budgets.find(query, {"_id": 0}).to_list(100)
    
    # Calculate spent amount for each budget
    for budget in budgets:
        start_date = f"{budget['month']}-01T00:00:00"
        month_str = budget['month']
        if month_str[5:7] == "12":
            end_date = f"{int(month_str[:4])+1}-01-01T00:00:00"
        else:
            end_date = f"{month_str[:5]}{int(month_str[5:7])+1:02d}-01T00:00:00"
        
        pipeline = [
            {"$match": {
                "family_id": user["family_id"],
                "category": budget["category"],
                "is_expense": True,
                "date": {"$gte": start_date, "$lt": end_date}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        
        result = await db.transactions.aggregate(pipeline).to_list(1)
        budget["spent"] = result[0]["total"] if result else 0.0
    
    return [BudgetResponse(**b) for b in budgets]

@api_router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str, user: dict = Depends(get_current_user)):
    result = await db.budgets.delete_one({"id": budget_id, "family_id": user.get("family_id")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget non trovato")
    return {"message": "Budget eliminato"}

# ==================== STATISTICS ====================

@api_router.get("/stats/overview")
async def get_overview_stats(user: dict = Depends(get_current_user)):
    if not user.get("family_id"):
        return {"total_balance": 0, "monthly_expenses": 0, "monthly_income": 0, "categories": []}
    
    # Total balance from all accounts
    accounts = await db.bank_accounts.find({"family_id": user["family_id"]}, {"_id": 0}).to_list(100)
    total_balance = sum(acc.get("balance", 0) for acc in accounts)
    
    # Current month transactions
    now = datetime.now(timezone.utc)
    current_month = now.strftime("%Y-%m")
    start_date = f"{current_month}-01T00:00:00"
    
    if now.month == 12:
        end_date = f"{now.year + 1}-01-01T00:00:00"
    else:
        end_date = f"{now.year}-{now.month + 1:02d}-01T00:00:00"
    
    # Monthly expenses
    expense_pipeline = [
        {"$match": {
            "family_id": user["family_id"],
            "is_expense": True,
            "date": {"$gte": start_date, "$lt": end_date}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    expense_result = await db.transactions.aggregate(expense_pipeline).to_list(1)
    monthly_expenses = expense_result[0]["total"] if expense_result else 0
    
    # Monthly income
    income_pipeline = [
        {"$match": {
            "family_id": user["family_id"],
            "is_expense": False,
            "date": {"$gte": start_date, "$lt": end_date}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    income_result = await db.transactions.aggregate(income_pipeline).to_list(1)
    monthly_income = income_result[0]["total"] if income_result else 0
    
    # Expenses by category
    category_pipeline = [
        {"$match": {
            "family_id": user["family_id"],
            "is_expense": True,
            "date": {"$gte": start_date, "$lt": end_date}
        }},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}},
        {"$limit": 6}
    ]
    category_result = await db.transactions.aggregate(category_pipeline).to_list(10)
    categories = [
        {
            "category": c["_id"],
            "amount": c["total"],
            "icon": CATEGORIES.get(c["_id"], CATEGORIES["altro"])["icon"],
            "color": CATEGORIES.get(c["_id"], CATEGORIES["altro"])["color"]
        }
        for c in category_result
    ]
    
    return {
        "total_balance": round(total_balance, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "monthly_income": round(monthly_income, 2),
        "categories": categories
    }

@api_router.get("/stats/monthly")
async def get_monthly_stats(months: int = 6, user: dict = Depends(get_current_user)):
    if not user.get("family_id"):
        return []
    
    result = []
    now = datetime.now(timezone.utc)
    
    for i in range(months):
        # Calculate month
        month_date = now - timedelta(days=30 * i)
        month_str = month_date.strftime("%Y-%m")
        start_date = f"{month_str}-01T00:00:00"
        
        if month_date.month == 12:
            end_date = f"{month_date.year + 1}-01-01T00:00:00"
        else:
            end_date = f"{month_date.year}-{month_date.month + 1:02d}-01T00:00:00"
        
        # Expenses
        expense_pipeline = [
            {"$match": {
                "family_id": user["family_id"],
                "is_expense": True,
                "date": {"$gte": start_date, "$lt": end_date}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        expense_result = await db.transactions.aggregate(expense_pipeline).to_list(1)
        expenses = expense_result[0]["total"] if expense_result else 0
        
        # Income
        income_pipeline = [
            {"$match": {
                "family_id": user["family_id"],
                "is_expense": False,
                "date": {"$gte": start_date, "$lt": end_date}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        income_result = await db.transactions.aggregate(income_pipeline).to_list(1)
        income = income_result[0]["total"] if income_result else 0
        
        result.append({
            "month": month_str,
            "expenses": round(expenses, 2),
            "income": round(income, 2)
        })
    
    return list(reversed(result))

# ==================== CATEGORIES ====================

@api_router.get("/categories")
async def get_categories():
    return CATEGORIES

# ==================== NOTIFICATION SETTINGS ====================

@api_router.put("/settings/notifications")
async def update_notification_settings(data: NotificationSettingsUpdate, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"notification_settings": data.model_dump()}}
    )
    return {"message": "Impostazioni aggiornate"}

@api_router.get("/settings/notifications")
async def get_notification_settings(user: dict = Depends(get_current_user)):
    return user.get("notification_settings", {
        "push_enabled": True,
        "email_enabled": False,
        "transaction_alerts": True,
        "budget_alerts": True
    })

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Focolare API - Family Budget Manager", "status": "ok"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
