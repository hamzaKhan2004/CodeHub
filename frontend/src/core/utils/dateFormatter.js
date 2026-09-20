/**
 * Relative and Absolute Date Formatter (Layer 4)
 */

export const formatDate = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 30) return "just now";
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return diffInDays === 1 ? "yesterday" : `${diffInDays} days ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export const formatFullDate = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    return date.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
