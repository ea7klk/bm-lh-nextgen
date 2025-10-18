const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateAdmin } = require('../middleware/adminAuth');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     basicAuth:
 *       type: http
 *       scheme: basic
 *       description: Admin authentication using Basic Auth (username is ignored, only password is checked)
 */

/**
 * Admin home page - HTML interface
 */
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Brandmeister Lastheard Next Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            padding: 30px;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 14px;
        }
        .section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            padding: 30px;
            margin-bottom: 20px;
        }
        h2 {
            color: #333;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .refresh-btn {
            padding: 8px 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }
        .refresh-btn:hover {
            background: #5568d3;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        th {
            background: #f8f9fa;
            color: #333;
            font-weight: 600;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .delete-btn {
            padding: 6px 12px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        .delete-btn:hover {
            background: #c82333;
        }
        .status-active {
            color: #28a745;
            font-weight: 600;
        }
        .status-inactive {
            color: #dc3545;
            font-weight: 600;
        }
        .status-verified {
            color: #28a745;
            font-weight: 600;
        }
        .status-pending {
            color: #ffc107;
            font-weight: 600;
        }
        .message {
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        .empty {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        code {
            font-family: 'Courier New', monospace;
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
        }
        .back-link:hover {
            text-decoration: underline;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            flex: 1;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .stat-value {
            color: #333;
            font-size: 28px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Admin Panel</h1>
            <p class="subtitle">Brandmeister Lastheard Next Generation - User Management</p>
        </div>

        <div id="message" class="message"></div>

        <div class="section">
            <h2>
                Users
                <button class="refresh-btn" onclick="loadUsers()">🔄 Refresh</button>
            </h2>
            <div class="stats" id="userStats">
                <div class="stat-card">
                    <div class="stat-label">Total Users</div>
                    <div class="stat-value" id="totalUsers">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Users</div>
                    <div class="stat-value" id="activeUsers">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Inactive Users</div>
                    <div class="stat-value" id="inactiveUsers">-</div>
                </div>
            </div>
            <div id="usersContent" class="loading">Loading...</div>
        </div>

        <a href="/" class="back-link">← Back to Home</a>
    </div>

    <script>
        function showMessage(message, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = message;
            messageDiv.className = 'message ' + type;
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }

        function formatDate(timestamp) {
            if (!timestamp) return '-';
            const date = new Date(timestamp * 1000);
            return date.toLocaleString();
        }

        function formatExpiry(timestamp) {
            if (!timestamp) return '-';
            const date = new Date(timestamp * 1000);
            const now = new Date();
            const diff = date - now;
            const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            if (daysLeft < 0) {
                return '<span style="color: #dc3545;">Expired</span>';
            } else if (daysLeft < 30) {
                return '<span style="color: #ffc107;">Expires in ' + daysLeft + ' days</span>';
            } else {
                return '<span style="color: #28a745;">Expires in ' + daysLeft + ' days</span>';
            }
        }

        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }

        async function loadUsers() {
            try {
                const response = await fetch('/admin/users');
                if (!response.ok) throw new Error('Failed to load users');
                
                const data = await response.json();
                
                // Update stats
                document.getElementById('totalUsers').textContent = data.length;
                document.getElementById('activeUsers').textContent = data.filter(u => u.is_active).length;
                document.getElementById('inactiveUsers').textContent = data.filter(u => !u.is_active).length;
                
                const content = document.getElementById('usersContent');
                
                if (data.length === 0) {
                    content.innerHTML = '<div class="empty">No users found</div>';
                    return;
                }
                
                let html = '<table>';
                html += '<thead><tr>';
                html += '<th>Callsign</th>';
                html += '<th>Name</th>';
                html += '<th>Email</th>';
                html += '<th>Status</th>';
                html += '<th>Created</th>';
                html += '<th>Last Login</th>';
                html += '<th>Actions</th>';
                html += '</tr></thead><tbody>';
                
                data.forEach(user => {
                    html += '<tr>';
                    html += '<td><code>' + escapeHtml(user.callsign) + '</code></td>';
                    html += '<td>' + escapeHtml(user.name) + '</td>';
                    html += '<td>' + escapeHtml(user.email) + '</td>';
                    html += '<td><span class="status-' + (user.is_active ? 'active' : 'inactive') + '">' + (user.is_active ? 'Active' : 'Inactive') + '</span></td>';
                    html += '<td>' + formatDate(user.created_at) + '</td>';
                    html += '<td>' + formatDate(user.last_login_at) + '</td>';
                    html += '<td>';
                    if (user.is_active) {
                        html += '<button class="delete-btn" style="background: #ffc107; margin-right: 5px;" onclick="toggleUserStatus(' + user.id + ', 0)">Deactivate</button>';
                    } else {
                        html += '<button class="delete-btn" style="background: #28a745; margin-right: 5px;" onclick="toggleUserStatus(' + user.id + ', 1)">Activate</button>';
                    }
                    html += '<button class="delete-btn" onclick="deleteUser(' + user.id + ')">Delete</button>';
                    html += '</td>';
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
                content.innerHTML = html;
            } catch (error) {
                console.error('Error loading users:', error);
                document.getElementById('usersContent').innerHTML = '<div class="error">Error loading users</div>';
            }
        }

        async function toggleUserStatus(id, newStatus) {
            const action = newStatus ? 'activate' : 'deactivate';
            if (!confirm('Are you sure you want to ' + action + ' this user?')) return;
            
            try {
                const response = await fetch('/admin/users/' + id + '/status', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ is_active: newStatus })
                });
                
                if (!response.ok) throw new Error('Failed to update user status');
                
                showMessage('User ' + action + 'd successfully', 'success');
                loadUsers();
            } catch (error) {
                console.error('Error updating user status:', error);
                showMessage('Failed to update user status', 'error');
            }
        }

        async function deleteUser(id) {
            if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
            
            try {
                const response = await fetch('/admin/users/' + id, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Failed to delete user');
                
                showMessage('User deleted successfully', 'success');
                loadUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                showMessage('Failed to delete user', 'error');
            }
        }

        // Load data on page load
        loadUsers();
    </script>
</body>
</html>
  `);
});

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve a list of all registered users with their details
 *     tags:
 *       - Admin - User Management
 *     security:
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get('/users', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, callsign, name, email, is_active, created_at, last_login_at, locale FROM users ORDER BY created_at DESC');
    const users = stmt.all();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @swagger
 * /admin/users/{id}/status:
 *   put:
 *     summary: Update user status (Admin only)
 *     description: Activate or deactivate a user account
 *     tags:
 *       - Admin - User Management
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: integer
 *                 description: User active status (0 for inactive, 1 for active)
 *                 example: 1
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User status updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.put('/users/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    if (is_active === undefined) {
      return res.status(400).json({ error: 'is_active field is required' });
    }
    
    const stmt = db.prepare('UPDATE users SET is_active = ? WHERE id = ?');
    const result = stmt.run(is_active ? 1 : 0, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     description: Permanently delete a user account and all associated sessions
 *     tags:
 *       - Admin - User Management
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete user sessions first (cascading delete)
    const deleteSessionsStmt = db.prepare('DELETE FROM user_sessions WHERE user_id = ?');
    deleteSessionsStmt.run(id);
    
    // Delete user
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
