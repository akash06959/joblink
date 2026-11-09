/**
 * UserAvatar — shared component used everywhere in the app.
 *
 * Props:
 *   user     : object with { name, avatar }  (defaults to localStorage user)
 *   name     : string  (used as fallback when no user.name)
 *   size     : number  (Tailwind unit — e.g. 8 → w-8 h-8)
 *   className: string  (extra classes)
 *   onClick  : fn
 *
 * Priority:
 *   1. user.avatar  → real photo from server
 *   2. name/user.name initials → gradient circle fallback
 */
import { useState, useEffect } from 'react';

const API = 'http://localhost:5000';

const initials = (name = '') =>
    name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const getLocalUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
};

const UserAvatar = ({
    user: userProp,
    name,
    size = 9,
    className = '',
    onClick,
}) => {
    /* If no user prop provided, keep in sync with localStorage */
    const [localUser, setLocalUser] = useState(getLocalUser);

    useEffect(() => {
        if (userProp) return; // external prop overrides — no need to listen
        const handleStorage = () => setLocalUser(getLocalUser());
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [userProp]);

    /* Resolve user object — prop takes priority, else reactive localStorage */
    const resolvedUser = userProp ?? localUser;

    const displayName = name || resolvedUser?.name || '';
    const avatarPath = resolvedUser?.avatar;

    /* Build a deterministic gradient from the name for the fallback */
    const gradients = [
        'from-blue-500 to-indigo-600',
        'from-purple-500 to-pink-600',
        'from-green-500 to-teal-600',
        'from-orange-500 to-red-600',
        'from-cyan-500 to-blue-600',
    ];
    const gradient = gradients[(displayName.charCodeAt(0) || 0) % gradients.length];

    const sizeClass = `w-${size} h-${size}`;

    return (
        <div
            className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            {avatarPath ? (
                <img
                    src={`${API}/${avatarPath}`}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    /* fallback to initials if image 404s */
                    onError={e => {
                        e.target.style.display = 'none';
                        e.target.parentNode.classList.add('_avatar-fallback');
                    }}
                />
            ) : (
                <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs`}>
                    {initials(displayName)}
                </div>
            )}
        </div>
    );
};

export default UserAvatar;
