import React, { useState } from "react";
import { formatDate } from "../../utils/DateConvertionFormat";
import { Check } from "lucide-react";
import ConfirmationDialog from "../shared/ConfirmationDialog";

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

interface NotificationModalProps {
  notifications: Notification[];
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications,
  markAsRead,
  markAllAsRead,
}) => {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const filteredNotifications =
    tab === "all" ? notifications : notifications.filter((n) => !n.is_read);

  const handleOpenDetail = (n: Notification) => {
    if (!n.is_read) markAsRead(n.notification_id);
    setSelectedNotification(n);
  };

  const closeDetailModal = () => setSelectedNotification(null);

  return (
    <>
      {/* Main notification list modal */}
      <div className="fixed top-16 right-6 w-96 bg-white rounded-md shadow-xl border border-gray-200 px-3 py-4 z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-bold text-xl text-gray-900">Notifications</h1>
          <div className="space-x-2 flex items-center">
            <button
              onClick={() => setTab("all")}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                tab === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTab("unread")}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                tab === "unread"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {filteredNotifications.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-6">
              No notifications
            </p>
          )}
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOpenDetail(n)}
              className={`flex items-start p-4 mb-2 cursor-pointer  transition-all hover:shadow-md hover:bg-gray-50 border-b ${
                !n.is_read
                  ? "bg-blue-50  border-b-blue-500"
                  : "bg-white border-b-gray-200"
              }`}
            >
              {/* Avatar / Icon */}
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-sm">
                  {n.actor_name
                    ? n.actor_name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()
                    : "S"}
                </div>
              </div>

              {/* Notification content */}
              <div className="flex-1 min-w-0">
                <p>
                  <span className="font-semibold text-gray-900">
                    {n.actor_name}:
                  </span>{" "}
                </p>
                <div className="text-sm">
                  <span className="text-gray-700">{n.message}</span>
                </div>
                {n.details && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {n.details}
                  </p>
                )}
                <span className="text-xs text-gray-400 mt-1 block">
                  {formatDate(n.created_at)}
                </span>
              </div>

              {/* Unread indicator */}
              {!n.is_read && (
                <div className="ml-3 mt-2 w-3 h-3 bg-green-500 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setShowConfirm(true);
          }}
          className="px-3 py-1 ml-2 rounded-full text-sm font-medium  text-black flex items-center cursor-pointer text-[14px] gap-1 hover:underline"
        >
          <Check className="w-4 h-4" />
          Mark All as Read
        </button>
        <ConfirmationDialog
          isOpen={showConfirm}
          message="Are you sure you want to mark all notifications as read?"
          onConfirm={() => {
            markAllAsRead();
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
          confirmText="Yes"
          cancelText="No"
        />
      </div>

      {/* Detailed notification modal */}
      {selectedNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-20">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDetailModal}
          />

          {/* Modal content */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md z-30">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              From:{" "}
              <span className="font-bold text-gray-800">
                {selectedNotification.actor_name || "System"}
              </span>
            </h2>
            <p className="text-gray-700 mb-3">{selectedNotification.message}</p>
            {selectedNotification.details && (
              <p className="text-gray-500 mb-4">
                {selectedNotification.details}
              </p>
            )}
            <span className="text-xs text-gray-400">
              {new Date(selectedNotification.created_at).toLocaleString()}
            </span>

            <div className="flex justify-end gap-3 mt-5">
              {selectedNotification.action_required &&
                selectedNotification.action_type && (
                  <>
                    <button className="px-4 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium">
                      Decline
                    </button>
                    <button className="px-4 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
                      Accept
                    </button>
                  </>
                )}
              <button
                className="px-4 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm font-medium"
                onClick={closeDetailModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationModal;
