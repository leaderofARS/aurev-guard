#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Standalone script to fetch Blockfrost data for a wallet.
Called from Node.js backend.
"""
import sys
import os
import json
import traceback
from pathlib import Path

# Fix Windows console encoding for Unicode characters
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Get project root from command line argument or environment
if len(sys.argv) > 1:
    project_root = Path(sys.argv[1]).resolve()
else:
    # Fallback: try to find project root relative to this script
    script_dir = Path(__file__).parent.resolve()
    project_root = script_dir.parent.parent.parent.resolve()

# Add project root to Python path FIRST (multiple times to be sure)
project_root_str = str(project_root)
if project_root_str not in sys.path:
    sys.path.insert(0, project_root_str)

# Also add it as absolute path
if project_root_str not in sys.path:
    sys.path.insert(0, project_root_str)

# Change to project root
os.chdir(project_root_str)

# Debug info
debug_info = {
    'project_root': project_root_str,
    'cwd': os.getcwd(),
    'python_path': sys.path[:10],
    'agents_exists': os.path.exists(os.path.join(project_root_str, 'agents')),
    'agents_init_exists': os.path.exists(os.path.join(project_root_str, 'agents', '__init__.py')),
    'agents_ai_model_exists': os.path.exists(os.path.join(project_root_str, 'agents', 'ai_model')),
    'script_location': str(Path(__file__).resolve()),
    'python_executable': sys.executable,
}

try:
    # Check for Blockfrost API key
    if not os.getenv('BLOCKFROST_API_KEY'):
        error_msg = {
            'error': 'BLOCKFROST_API_KEY environment variable not set',
            'debug': debug_info
        }
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)
    
    # Redirect stdout to stderr to capture any logs (like "Models loaded successfully")
    # so they don't break the JSON output
    original_stdout = sys.stdout
    sys.stdout = sys.stderr
    
    try:
        # Import the function (this triggers the "Models loaded successfully" print)
        from agents.ai_model.src.live_pipeline import fetch_wallet_transactions
        
        # Get wallet address from command line
        if len(sys.argv) < 3:
            # Restore stdout for error
            sys.stdout = original_stdout
            error_msg = {
                'error': 'Wallet address required as second argument',
                'debug': debug_info
            }
            print(json.dumps(error_msg), file=sys.stderr)
            sys.exit(1)
        
        wallet_address = sys.argv[2]
        max_transactions = int(sys.argv[3]) if len(sys.argv) > 3 else 100
        
        # Fetch data
        result = fetch_wallet_transactions(wallet_address, max_transactions=max_transactions)
        
        # Check if result has error
        if result.get('error'):
            # If API error, generate mock data instead of failing
            import random
            from datetime import datetime, timezone
            
            # Generate mock transactions
            mock_txs = []
            for i in range(15):
                mock_txs.append({
                    "tx_hash": f"mock_tx_{i}_{random.randint(1000,9999)}",
                    "block_time": datetime.now(timezone.utc).isoformat(),
                    "block_height": 1000000 + i,
                    "fees": random.randint(150000, 300000),
                    "size": random.randint(200, 1000),
                    "inputs": [{"address": wallet_address, "amount": [{"unit": "lovelace", "quantity": str(random.randint(1000000, 5000000))}]}],
                    "outputs": [{"address": "addr_test_mock_dest", "amount": [{"unit": "lovelace", "quantity": str(random.randint(500000, 2000000))}]}]
                })
                
            result = {
                "wallet_address": wallet_address,
                "transaction_count": len(mock_txs),
                "transactions": mock_txs,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "⚠️ Using MOCK DATA (Blockfrost API Key invalid or expired)"
            }
            
    finally:
        # Restore stdout for the final JSON output
        sys.stdout = original_stdout
    
    # Output result as JSON
    print(json.dumps(result))
    
except ImportError as e:
    # Ensure stdout is restored
    if sys.stdout != sys.__stdout__:
        sys.stdout = sys.__stdout__
        
    error_details = {
        'error': f'Import error: {str(e)}',
        'wallet_address': sys.argv[2] if len(sys.argv) > 2 else 'unknown',
        'transaction_count': 0,
        'transactions': [],
        'python_path': sys.path[:10],
        'cwd': os.getcwd(),
        'project_root': project_root_str,
        'traceback': traceback.format_exc(),
        'debug': debug_info
    }
    print(json.dumps(error_details), file=sys.stderr)
    sys.exit(1)
except Exception as e:
    # Ensure stdout is restored
    if sys.stdout != sys.__stdout__:
        sys.stdout = sys.__stdout__
        
    error_details = {
        'error': str(e),
        'wallet_address': sys.argv[2] if len(sys.argv) > 2 else 'unknown',
        'transaction_count': 0,
        'transactions': [],
        'traceback': traceback.format_exc(),
        'debug': debug_info
    }
    print(json.dumps(error_details), file=sys.stderr)
    sys.exit(1)
