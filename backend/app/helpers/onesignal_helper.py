import os

import requests


def send_notification_to_users(user_ids, message):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {os.environ['ONESIGNAL_API_KEY']}",
    }

    data = {
        "app_id": os.environ["ONESIGNAL_APP_ID"],
        "include_player_ids": user_ids,
        "contents": {"en": message},
    }

    response = requests.post(
        "https://onesignal.com/api/v1/notifications", json=data, headers=headers
    )

    if response.status_code == 200:
        print("OneSignal: Notification sent successfully")
    else:
        print("OneSignal: Failed to send notification")
