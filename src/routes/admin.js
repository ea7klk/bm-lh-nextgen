const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { updateTalkgroups } = require('../services/talkgroupsService');
const { sendBulkEmail } = require('../services/emailService');
const { generateMatomoScript } = require('../utils/htmlHelpers');

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
 * Get database statistics (Admin only)
 */
router.get('/stats', async (req, res) => {
  try {
    const totalRecords = await pool.query('SELECT COUNT(*) as count FROM lastheard WHERE "DestinationID" != 9');
    const uniqueTalkgroups = await pool.query('SELECT COUNT(DISTINCT "DestinationID") as count FROM lastheard WHERE "DestinationID" != 9');
    const uniqueCallsigns = await pool.query('SELECT COUNT(DISTINCT "SourceCall") as count FROM lastheard WHERE "DestinationID" != 9');
    
    res.json({
      totalRecords: parseInt(totalRecords.rows[0].count),
      uniqueTalkgroups: parseInt(uniqueTalkgroups.rows[0].count),
      uniqueCallsigns: parseInt(uniqueCallsigns.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * Expunge old records (Admin only)
 */
router.post('/expunge', async (req, res) => {
  try {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    const result = await pool.query('DELETE FROM lastheard WHERE "Start" < $1', [sevenDaysAgo]);
    
    res.json({
      message: 'Records expunged successfully',
      deletedCount: result.rowCount
    });
  } catch (error) {
    console.error('Error expunging records:', error);
    res.status(500).json({ error: 'Failed to expunge records' });
  }
});

/**
 * Update talkgroups from Brandmeister (Admin only)
 */
router.post('/update-talkgroups', async (req, res) => {
  try {
    console.log('Manual talkgroups update triggered by admin');
    const result = await updateTalkgroups();
    
    if (result.success) {
      res.json({
        success: true,
        readFromSource: result.readFromSource,
        added: result.added,
        updated: result.updated,
        totalBefore: result.totalBefore,
        totalAfter: result.totalAfter
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to update talkgroups' 
      });
    }
  } catch (error) {
    console.error('Error updating talkgroups:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update talkgroups' 
    });
  }
});

/**
 * Send email to all users (Admin only)
 */
router.post('/send-email-to-all', async (req, res) => {
  try {
    const { subject, htmlContent, plainContent } = req.body;
    
    if (!subject || !htmlContent || !plainContent) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }
    
    // Get all active users with their emails
    const usersQuery = await pool.query(`
      SELECT email, name, locale FROM users 
      WHERE is_active = true AND email IS NOT NULL
    `);
    
    if (usersQuery.rows.length === 0) {
      return res.status(400).json({ error: 'No active users found' });
    }
    
    // Send emails
    const results = await sendBulkEmail(usersQuery.rows, subject, htmlContent, plainContent);
    
    res.json({
      success: true,
      sentCount: results.successful,
      failedCount: results.failed,
      totalUsers: usersQuery.rows.length
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

/**
 * Get user by ID for editing (Admin only)
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, callsign, name, email, is_active, created_at, last_login_at, locale FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * Update user data (Admin only)
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, is_active, locale } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, is_active = $3, locale = $4 WHERE id = $5',
      [name, email, is_active, locale || 'en', id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Admin home page - HTML interface
 */
router.get('/', async (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Brandmeister Lastheard Next Generation</title>
    <!-- Quill.js Rich Text Editor -->
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
    ${generateMatomoScript()}
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
        .clickable-callsign {
            color: #667eea;
            cursor: pointer;
            text-decoration: none;
        }
        .clickable-callsign:hover {
            text-decoration: underline;
        }
        .expunge-btn {
            padding: 12px 24px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
        }
        .expunge-btn:hover {
            background: #c82333;
        }
        .expunge-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
        }
        .modal-content {
            background-color: white;
            margin: 10% auto;
            padding: 30px;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .modal-header h2 {
            margin: 0;
        }
        .close {
            color: #aaa;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            line-height: 1;
        }
        .close:hover {
            color: #000;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: 600;
        }
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        .btn-primary {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }
        .btn-primary:hover {
            background: #5568d3;
        }
        .btn-secondary {
            padding: 10px 20px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        /* Rich text editor styling */
        #emailEditor {
            background: white;
        }
        .ql-toolbar {
            border-top: 1px solid #ccc !important;
            border-left: 1px solid #ccc !important;
            border-right: 1px solid #ccc !important;
            border-bottom: none !important;
        }
        .ql-container {
            border-bottom: 1px solid #ccc !important;
            border-left: 1px solid #ccc !important;
            border-right: 1px solid #ccc !important;
            border-top: none !important;
        }
        .ql-editor {
            min-height: 150px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
            <h2>📊 Database Statistics</h2>
            <div class="stats" id="dbStats">
                <div class="stat-card">
                    <div class="stat-label">Total Lastheard Records</div>
                    <div class="stat-value" id="totalRecords">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Unique Talkgroups</div>
                    <div class="stat-value" id="uniqueTalkgroups">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Unique Callsigns</div>
                    <div class="stat-value" id="uniqueCallsigns">-</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>
                👥 Users
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

        <div class="section">
            <h2>🗑️ Database Maintenance</h2>
            <p style="color: #666; margin-bottom: 20px;">
                Remove records older than 7 days from the database to free up space and improve performance.
            </p>
            <button class="expunge-btn" onclick="expungeOldRecords()" id="expungeBtn">
                Expunge Records Older Than 7 Days
            </button>
            <p style="color: #666; margin: 30px 0 20px 0;">
                Update talkgroups database from Brandmeister API. This process runs automatically at 02:00 AM daily.
            </p>
            <button class="expunge-btn" style="background: #28a745;" onclick="updateTalkgroups()" id="updateTgBtn">
                Update BM TGs
            </button>
        </div>

        <div class="section">
            <h2>📧 Send Email to All Users</h2>
            <p style="color: #666; margin-bottom: 20px;">
                Send an announcement or newsletter to all registered users. The email will be sent in both HTML and plain text formats.
            </p>
            <form id="emailForm" onsubmit="sendEmailToAllUsers(event)">
                <div style="margin-bottom: 15px;">
                    <label for="emailSubject" style="display: block; margin-bottom: 5px; font-weight: 600;">Subject:</label>
                    <input type="text" id="emailSubject" required 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="emailContent" style="display: block; margin-bottom: 5px; font-weight: 600;">Message:</label>
                    <div id="emailEditor" style="border: 1px solid #ddd; border-radius: 6px; min-height: 200px;"></div>
                    <textarea id="emailContent" name="content" style="display: none;" required></textarea>
                    <small style="color: #666; margin-top: 5px; display: block;">
                        The email will be sent in both HTML format and automatically converted to plain text for compatibility.
                    </small>
                </div>
                <button type="submit" id="sendEmailBtn" class="expunge-btn" style="background: #17a2b8;">
                    📧 Send Email to All Users
                </button>
            </form>
        </div>

        <a href="/" class="back-link">← Back to Home</a>
    </div>

    <!-- Update Talkgroups Modal -->
    <div id="updateTgModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Update Talkgroups</h2>
                <span class="close" onclick="closeUpdateTgModal()" id="updateTgClose" style="display: none;">&times;</span>
            </div>
            <div id="updateTgContent">
                <div class="loading">
                    <p>Talkgroup update process running...</p>
                    <p style="color: #999; margin-top: 10px;">This may take a few moments.</p>
                </div>
            </div>
            <div class="form-actions" id="updateTgActions" style="display: none;">
                <button type="button" class="btn-primary" onclick="closeUpdateTgModal()">Close</button>
            </div>
        </div>
    </div>

    <!-- Edit User Modal -->
    <div id="editUserModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit User</h2>
                <span class="close" onclick="closeEditModal()">&times;</span>
            </div>
            <form id="editUserForm">
                <input type="hidden" id="editUserId">
                <div class="form-group">
                    <label>Callsign</label>
                    <input type="text" id="editCallsign" disabled>
                </div>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="editName" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="editEmail" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="editStatus">
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Language</label>
                    <select id="editLocale">
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                        <option value="fr">Français</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeEditModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
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

        async function loadStats() {
            try {
                const response = await fetch('/admin/stats');
                if (!response.ok) throw new Error('Failed to load stats');
                
                const data = await response.json();
                document.getElementById('totalRecords').textContent = data.totalRecords.toLocaleString();
                document.getElementById('uniqueTalkgroups').textContent = data.uniqueTalkgroups.toLocaleString();
                document.getElementById('uniqueCallsigns').textContent = data.uniqueCallsigns.toLocaleString();
            } catch (error) {
                console.error('Error loading stats:', error);
            }
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
                    html += '<td><a href="#" class="clickable-callsign" onclick="editUser(' + user.id + '); return false;"><code>' + escapeHtml(user.callsign) + '</code></a></td>';
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

        async function editUser(id) {
            try {
                const response = await fetch('/admin/users/' + id);
                if (!response.ok) throw new Error('Failed to load user');
                
                const user = await response.json();
                
                document.getElementById('editUserId').value = user.id;
                document.getElementById('editCallsign').value = user.callsign;
                document.getElementById('editName').value = user.name;
                document.getElementById('editEmail').value = user.email;
                document.getElementById('editStatus').value = user.is_active ? 'true' : 'false';
                document.getElementById('editLocale').value = user.locale || 'en';
                
                document.getElementById('editUserModal').style.display = 'block';
            } catch (error) {
                console.error('Error loading user:', error);
                showMessage('Failed to load user data', 'error');
            }
        }

        function closeEditModal() {
            document.getElementById('editUserModal').style.display = 'none';
        }

        document.getElementById('editUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('editUserId').value;
            const name = document.getElementById('editName').value;
            const email = document.getElementById('editEmail').value;
            const is_active = document.getElementById('editStatus').value === 'true';
            const locale = document.getElementById('editLocale').value;
            
            try {
                const response = await fetch('/admin/users/' + id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, is_active, locale })
                });
                
                if (!response.ok) throw new Error('Failed to update user');
                
                showMessage('User updated successfully', 'success');
                closeEditModal();
                loadUsers();
            } catch (error) {
                console.error('Error updating user:', error);
                showMessage('Failed to update user', 'error');
            }
        });

        async function expungeOldRecords() {
            if (!confirm('Are you sure you want to delete all records older than 7 days? This action cannot be undone.')) {
                return;
            }
            
            const btn = document.getElementById('expungeBtn');
            btn.disabled = true;
            btn.textContent = 'Processing...';
            
            try {
                const response = await fetch('/admin/expunge', {
                    method: 'POST'
                });
                
                if (!response.ok) throw new Error('Failed to expunge records');
                
                const data = await response.json();
                showMessage('Successfully deleted ' + data.deletedCount.toLocaleString() + ' old records', 'success');
                loadStats(); // Reload stats
            } catch (error) {
                console.error('Error expunging records:', error);
                showMessage('Failed to expunge records', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Expunge Records Older Than 7 Days';
            }
        }

        async function updateTalkgroups() {
            // Show modal
            const modal = document.getElementById('updateTgModal');
            modal.style.display = 'block';
            
            // Reset content to loading state
            document.getElementById('updateTgContent').innerHTML = 
                '<div class="loading">' +
                    '<p>Talkgroup update process running...</p>' +
                    '<p style="color: #999; margin-top: 10px;">This may take a few moments.</p>' +
                '</div>';
            document.getElementById('updateTgActions').style.display = 'none';
            document.getElementById('updateTgClose').style.display = 'none';
            
            const btn = document.getElementById('updateTgBtn');
            btn.disabled = true;
            btn.textContent = 'Updating...';
            
            try {
                const response = await fetch('/admin/update-talkgroups', {
                    method: 'POST'
                });
                
                if (!response.ok) throw new Error('Failed to update talkgroups');
                
                const data = await response.json();
                
                // Show success results
                if (data.success) {
                    const readFromSource = (data.readFromSource || 0).toLocaleString();
                    const added = (data.added || 0).toLocaleString();
                    const updated = (data.updated || 0).toLocaleString();
                    const totalBefore = (data.totalBefore || 0).toLocaleString();
                    const totalAfter = (data.totalAfter || 0).toLocaleString();
                    
                    document.getElementById('updateTgContent').innerHTML = 
                        '<div style="padding: 20px 0;">' +
                            '<div class="message success" style="display: block; margin-bottom: 20px;">' +
                                'Talkgroup update completed successfully!' +
                            '</div>' +
                            '<div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 10px;">' +
                                '<strong>📊 Update Statistics:</strong>' +
                            '</div>' +
                            '<table style="width: 100%; margin-top: 10px;">' +
                                '<tr>' +
                                    '<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Read from source:</strong></td>' +
                                    '<td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">' + readFromSource + '</td>' +
                                '</tr>' +
                                '<tr>' +
                                    '<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Added to database:</strong></td>' +
                                    '<td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #28a745;">' + added + '</td>' +
                                '</tr>' +
                                '<tr>' +
                                    '<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Updated in database:</strong></td>' +
                                    '<td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #667eea;">' + updated + '</td>' +
                                '</tr>' +
                                '<tr>' +
                                    '<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>Total before update:</strong></td>' +
                                    '<td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">' + totalBefore + '</td>' +
                                '</tr>' +
                                '<tr>' +
                                    '<td style="padding: 10px;"><strong>Total after update:</strong></td>' +
                                    '<td style="padding: 10px; text-align: right; font-weight: 600;">' + totalAfter + '</td>' +
                                '</tr>' +
                            '</table>' +
                        '</div>';
                    document.getElementById('updateTgActions').style.display = 'flex';
                    document.getElementById('updateTgClose').style.display = 'block';
                    showMessage('Talkgroups updated successfully', 'success');
                } else {
                    throw new Error(data.error || 'Update failed');
                }
            } catch (error) {
                console.error('Error updating talkgroups:', error);
                document.getElementById('updateTgContent').innerHTML = 
                    '<div class="message error" style="display: block;">' +
                        'Failed to update talkgroups: ' + error.message +
                    '</div>';
                document.getElementById('updateTgActions').style.display = 'flex';
                document.getElementById('updateTgClose').style.display = 'block';
                showMessage('Failed to update talkgroups', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Update BM TGs';
            }
        }

        function closeUpdateTgModal() {
            document.getElementById('updateTgModal').style.display = 'none';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const editModal = document.getElementById('editUserModal');
            const updateTgModal = document.getElementById('updateTgModal');
            if (event.target == editModal) {
                closeEditModal();
            }
            if (event.target == updateTgModal) {
                closeUpdateTgModal();
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

        // Initialize rich text editor
        let quill;
        document.addEventListener('DOMContentLoaded', function() {
            quill = new Quill('#emailEditor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                    ]
                },
                placeholder: 'Compose your message to all users...'
            });
            
            // Update hidden textarea when quill content changes
            quill.on('text-change', function() {
                document.getElementById('emailContent').value = quill.root.innerHTML;
            });
        });

        async function sendEmailToAllUsers(event) {
            event.preventDefault();
            
            const subject = document.getElementById('emailSubject').value.trim();
            const htmlContent = quill.root.innerHTML;
            
            if (!subject) {
                showMessage('Please enter a subject', 'error');
                return;
            }
            
            if (quill.getText().trim().length === 0) {
                showMessage('Please enter a message', 'error');
                return;
            }
            
            if (!confirm('Are you sure you want to send this email to ALL registered users? This action cannot be undone.')) {
                return;
            }
            
            const btn = document.getElementById('sendEmailBtn');
            btn.disabled = true;
            btn.textContent = '📧 Sending...';
            
            try {
                const response = await fetch('/admin/send-email-to-all', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        subject: subject,
                        htmlContent: htmlContent,
                        plainContent: quill.getText()
                    })
                });
                
                if (!response.ok) throw new Error('Failed to send emails');
                
                const data = await response.json();
                showMessage('Successfully sent email to ' + data.sentCount + ' users', 'success');
                
                // Reset form
                document.getElementById('emailSubject').value = '';
                quill.setContents([]);
                document.getElementById('emailContent').value = '';
                
            } catch (error) {
                console.error('Error sending emails:', error);
                showMessage('Failed to send emails: ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '📧 Send Email to All Users';
            }
        }

        // Load data on page load
        loadStats();
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
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, callsign, name, email, is_active, created_at, last_login_at, locale FROM users ORDER BY created_at DESC');
    res.json(result.rows);
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
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    if (is_active === undefined) {
      return res.status(400).json({ error: 'is_active field is required' });
    }
    
    const result = await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id]);
    
    if (result.rowCount === 0) {
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
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete user sessions first (cascading delete)
    await pool.query(`DELETE FROM user_sessions WHERE user_id = $1`, [id]);
    
    // Delete user
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
