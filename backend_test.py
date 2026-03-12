#!/usr/bin/env python3
"""
Backend API Testing for Family Budget Management App (Focolare)
Tests all major functionality including auth, family management, bank accounts, 
transactions, budgets, and notification settings.
"""

import requests
import sys
import json
from datetime import datetime, timedelta

class FocolareTester:
    def __init__(self, base_url="https://family-budget-93.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.family_id = None
        self.account_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    return response.json() if response.text else {}
                except:
                    return {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json() if response.text else {}
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return {}

        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            return {}

    # ==================== HEALTH & SYSTEM TESTS ====================
    
    def test_health_endpoints(self):
        """Test basic health and system endpoints"""
        print("\n" + "="*60)
        print("🏥 TESTING HEALTH & SYSTEM ENDPOINTS")
        print("="*60)
        
        self.run_test("API Root", "GET", "/", 200)
        self.run_test("Health Check", "GET", "/health", 200)

    # ==================== AUTH TESTS ====================
    
    def test_user_registration(self):
        """Test user registration"""
        print("\n" + "="*60)
        print("👤 TESTING USER REGISTRATION")
        print("="*60)
        
        test_email = f"test_user_{self.timestamp}@example.com"
        test_password = "TestPassword123!"
        test_name = f"Test User {self.timestamp}"
        
        response = self.run_test(
            "User Registration",
            "POST",
            "/auth/register",
            200,
            data={
                "email": test_email,
                "password": test_password,
                "name": test_name
            }
        )
        
        if response and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   ✅ Registered user: {test_email}")
            print(f"   ✅ Got token: {self.token[:20]}...")
            print(f"   ✅ User ID: {self.user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        print("\n" + "="*60)
        print("🔑 TESTING USER LOGIN")
        print("="*60)
        
        # First register a user for login test
        test_email = f"login_test_{self.timestamp}@example.com"
        test_password = "LoginTest123!"
        
        # Register
        reg_response = self.run_test(
            "Register User for Login Test",
            "POST",
            "/auth/register", 
            200,
            data={
                "email": test_email,
                "password": test_password,
                "name": "Login Test User"
            }
        )
        
        if not reg_response:
            return False
            
        # Clear token to test login
        self.token = None
        
        # Login
        login_response = self.run_test(
            "User Login",
            "POST",
            "/auth/login",
            200,
            data={
                "email": test_email,
                "password": test_password
            }
        )
        
        if login_response and 'access_token' in login_response:
            self.token = login_response['access_token']
            print(f"   ✅ Login successful")
            return True
        return False
        
    def test_get_user_profile(self):
        """Test getting current user profile"""
        response = self.run_test("Get User Profile", "GET", "/auth/me", 200)
        return bool(response and 'id' in response)

    # ==================== FAMILY TESTS ====================
    
    def test_create_family(self):
        """Test creating a family group"""
        print("\n" + "="*60)
        print("👨‍👩‍👧‍👦 TESTING FAMILY MANAGEMENT")
        print("="*60)
        
        response = self.run_test(
            "Create Family",
            "POST",
            "/family",
            200,
            data={"name": f"Test Family {self.timestamp}"}
        )
        
        if response and 'id' in response:
            self.family_id = response['id']
            print(f"   ✅ Family created: {self.family_id}")
            return True
        return False
        
    def test_get_family(self):
        """Test getting family details"""
        response = self.run_test("Get Family", "GET", "/family", 200)
        return bool(response and 'id' in response)
        
    def test_invite_family_member(self):
        """Test inviting a family member"""
        # First create another user to invite
        invite_email = f"invite_test_{self.timestamp}@example.com"
        
        # Register the user to invite
        self.run_test(
            "Register User to Invite",
            "POST", 
            "/auth/register",
            200,
            data={
                "email": invite_email,
                "password": "InviteTest123!",
                "name": "Invite Test User"
            }
        )
        
        # Invite the user
        response = self.run_test(
            "Invite Family Member",
            "POST",
            "/family/invite", 
            200,
            data={"email": invite_email}
        )
        
        return bool(response and 'message' in response)

    # ==================== BANK ACCOUNT TESTS ====================
    
    def test_create_bank_account(self):
        """Test creating a bank account"""
        print("\n" + "="*60)
        print("🏦 TESTING BANK ACCOUNT MANAGEMENT (MOCKED)")
        print("="*60)
        
        response = self.run_test(
            "Create Bank Account",
            "POST",
            "/bank-accounts",
            200,
            data={
                "name": f"Test Account {self.timestamp}",
                "institution": "Test Bank",
                "account_type": "checking",
                "balance": 1000.50
            }
        )
        
        if response and 'id' in response:
            self.account_id = response['id']
            print(f"   ✅ Account created: {self.account_id}")
            print(f"   ✅ Initial balance: €{response['balance']}")
            return True
        return False
        
    def test_get_bank_accounts(self):
        """Test getting bank accounts list"""
        response = self.run_test("Get Bank Accounts", "GET", "/bank-accounts", 200)
        return bool(response and isinstance(response, list))
        
    def test_sync_bank_account(self):
        """Test syncing bank account (MOCKED - generates random transactions)"""
        if not self.account_id:
            print("❌ Cannot test sync - no account ID available")
            return False
            
        response = self.run_test(
            "Sync Bank Account (MOCKED)",
            "POST",
            f"/bank-accounts/{self.account_id}/sync",
            200
        )
        
        if response and 'transactions_count' in response:
            print(f"   ✅ Generated {response['transactions_count']} mock transactions")
            print(f"   ✅ New balance: €{response['new_balance']}")
            return True
        return False

    # ==================== TRANSACTION TESTS ====================
    
    def test_create_manual_transaction(self):
        """Test creating manual transaction"""
        print("\n" + "="*60)
        print("💸 TESTING TRANSACTION MANAGEMENT")
        print("="*60)
        
        response = self.run_test(
            "Create Manual Transaction",
            "POST",
            "/transactions",
            200,
            data={
                "account_id": self.account_id,
                "amount": 25.50,
                "description": f"Test Manual Transaction {self.timestamp}",
                "category": "alimentari",
                "is_expense": True
            }
        )
        
        if response and 'id' in response:
            print(f"   ✅ Transaction created: {response['id']}")
            print(f"   ✅ Amount: €{response['amount']}")
            print(f"   ✅ Category: {response['category']}")
            return True
        return False
        
    def test_get_transactions(self):
        """Test getting transactions list"""
        response = self.run_test("Get Transactions", "GET", "/transactions", 200)
        success = bool(response and isinstance(response, list))
        if success and response:
            print(f"   ✅ Found {len(response)} transactions")
        return success
        
    def test_get_transactions_with_filters(self):
        """Test getting transactions with category and month filters"""
        current_month = datetime.now().strftime("%Y-%m")
        
        # Test category filter
        self.run_test(
            "Get Transactions by Category",
            "GET", 
            "/transactions?category=alimentari",
            200
        )
        
        # Test month filter
        self.run_test(
            "Get Transactions by Month",
            "GET",
            f"/transactions?month={current_month}",
            200
        )
        
        return True

    # ==================== BUDGET TESTS ====================
    
    def test_create_budget(self):
        """Test creating a budget"""
        print("\n" + "="*60)
        print("📊 TESTING BUDGET MANAGEMENT")
        print("="*60)
        
        current_month = datetime.now().strftime("%Y-%m")
        
        response = self.run_test(
            "Create Budget",
            "POST",
            "/budgets",
            200,
            data={
                "category": "alimentari",
                "amount": 300.00,
                "month": current_month
            }
        )
        
        if response and 'id' in response:
            print(f"   ✅ Budget created: {response['id']}")
            print(f"   ✅ Category: {response['category']}")
            print(f"   ✅ Amount: €{response['amount']}")
            return True
        return False
        
    def test_get_budgets(self):
        """Test getting budgets list"""
        current_month = datetime.now().strftime("%Y-%m")
        
        response = self.run_test("Get Budgets", "GET", "/budgets", 200)
        success = bool(response and isinstance(response, list))
        
        # Test with month filter
        self.run_test(
            "Get Budgets by Month",
            "GET",
            f"/budgets?month={current_month}",
            200
        )
        
        return success

    # ==================== STATISTICS TESTS ====================
    
    def test_dashboard_stats(self):
        """Test dashboard statistics endpoints"""
        print("\n" + "="*60)
        print("📈 TESTING DASHBOARD STATISTICS")
        print("="*60)
        
        # Test overview stats
        overview_response = self.run_test("Get Overview Stats", "GET", "/stats/overview", 200)
        overview_success = bool(
            overview_response and 
            'total_balance' in overview_response and
            'monthly_expenses' in overview_response and
            'monthly_income' in overview_response
        )
        
        if overview_success:
            print(f"   ✅ Total Balance: €{overview_response['total_balance']}")
            print(f"   ✅ Monthly Expenses: €{overview_response['monthly_expenses']}")
            print(f"   ✅ Monthly Income: €{overview_response['monthly_income']}")
        
        # Test monthly stats
        monthly_response = self.run_test("Get Monthly Stats", "GET", "/stats/monthly?months=6", 200)
        monthly_success = bool(monthly_response and isinstance(monthly_response, list))
        
        if monthly_success and monthly_response:
            print(f"   ✅ Monthly data points: {len(monthly_response)}")
        
        return overview_success and monthly_success

    # ==================== NOTIFICATION SETTINGS TESTS ====================
    
    def test_notification_settings(self):
        """Test notification settings"""
        print("\n" + "="*60)
        print("🔔 TESTING NOTIFICATION SETTINGS")
        print("="*60)
        
        # Get current settings
        get_response = self.run_test("Get Notification Settings", "GET", "/settings/notifications", 200)
        get_success = bool(get_response and 'push_enabled' in get_response)
        
        if get_success:
            print(f"   ✅ Current settings retrieved")
        
        # Update settings
        update_response = self.run_test(
            "Update Notification Settings",
            "PUT",
            "/settings/notifications",
            200,
            data={
                "push_enabled": False,
                "email_enabled": True,
                "transaction_alerts": True,
                "budget_alerts": False
            }
        )
        
        update_success = bool(update_response and 'message' in update_response)
        
        if update_success:
            print(f"   ✅ Settings updated successfully")
        
        return get_success and update_success

    # ==================== CATEGORIES TEST ====================
    
    def test_get_categories(self):
        """Test getting available categories"""
        print("\n" + "="*60)
        print("🏷️ TESTING CATEGORIES")
        print("="*60)
        
        response = self.run_test("Get Categories", "GET", "/categories", 200)
        success = bool(response and isinstance(response, dict))
        
        if success:
            categories = list(response.keys())
            print(f"   ✅ Available categories: {len(categories)}")
            print(f"   ✅ Sample categories: {categories[:5]}")
        
        return success

    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 STARTING FOCOLARE API TEST SUITE")
        print("="*80)
        
        # Health checks
        self.test_health_endpoints()
        
        # Auth tests
        if not self.test_user_registration():
            print("❌ CRITICAL: Registration failed, stopping tests")
            return self.print_results()
            
        if not self.test_user_login():
            print("❌ CRITICAL: Login failed, continuing with registration token")
            
        self.test_get_user_profile()
        
        # Family tests
        if not self.test_create_family():
            print("❌ CRITICAL: Family creation failed, stopping family-dependent tests")
            return self.print_results()
            
        self.test_get_family()
        self.test_invite_family_member()
        
        # Bank account tests (mocked)
        if not self.test_create_bank_account():
            print("❌ WARNING: Bank account creation failed, some tests may fail")
            
        self.test_get_bank_accounts()
        self.test_sync_bank_account()
        
        # Transaction tests
        self.test_create_manual_transaction()
        self.test_get_transactions()
        self.test_get_transactions_with_filters()
        
        # Budget tests
        self.test_create_budget()
        self.test_get_budgets()
        
        # Statistics tests
        self.test_dashboard_stats()
        
        # Settings tests
        self.test_notification_settings()
        
        # Categories
        self.test_get_categories()
        
        return self.print_results()

    def print_results(self):
        """Print final test results"""
        print("\n" + "="*80)
        print("📊 FINAL TEST RESULTS")
        print("="*80)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0.0%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
            return 0
        else:
            print("❌ SOME TESTS FAILED")
            return 1

def main():
    tester = FocolareTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())