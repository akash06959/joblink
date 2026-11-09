const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.findByUser(req.user.id);
    res.json(notifications);
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.markAsRead(req.params.id, req.user.id);
    if (notification) {
        res.json(notification);
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    const notifications = await Notification.markAllAsRead(req.user.id);
    res.json(notifications);
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};
