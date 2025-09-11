import { useState, useEffect, useRef } from "react";
import axios from "axios";
import NotificationModal from "./NotificationModal";
import { Bell } from "lucide-react";
import { toast } from "react-toastify";

interface Notification {
  id: number;
  actor_name: string;
  message: string;
  details?: string | null;
  created_at: string;
  is_read: boolean;
  action_required?: boolean;
  action_type?: string;
  notification_id: number;
}

interface NotificationWrapperProps {
  userId: number;
}

const NotificationWrapper: React.FC<NotificationWrapperProps> = ({
  userId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/notification/${userId}`
        );
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    if (userId) fetchNotifications();
  }, [userId]);

  const markAsRead = async (notification_id: number) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notification/${notification_id}/read/${userId}`
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification_id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };
  const markAllAsRead = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/notification/read_all/${userId}`
      );
      toast.success(
        `${
          response.data?.updatedCount ||
          notifications.filter((n) => !n.is_read).length
        } notifications marked as read.`
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to mark all notifications as read.");
    }
  };

  // Handle clicks outside wrapper
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div ref={wrapperRef} className="relative z-20">
      <button
        onClick={() => setShowModal((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-gray-200"
      >
        <Bell className="w-6 h-6 fill-gray-800 text-gray-800" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showModal && (
        <div className="absolute right-0 mt-2">
          <NotificationModal
            notifications={notifications}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead} // <-- pass it here
          />
        </div>
      )}
    </div>
  );
};

export default NotificationWrapper;
