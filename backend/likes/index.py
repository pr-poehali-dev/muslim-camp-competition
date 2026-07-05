import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    """API для чтения и сохранения баллов отрядов и участниц лагеря. Хранит данные в общей базе, доступной всем устройствам.
    Args: event с httpMethod, body, queryStringParameters; context с request_id
    Returns: HTTP response dict со списком баллов или результатом сохранения
    """
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        if method == 'GET':
            cur.execute("SELECT squad_id, likes FROM squad_likes")
            squad_rows = cur.fetchall()
            cur.execute("SELECT member_id, likes FROM member_likes")
            member_rows = cur.fetchall()

            squads = {str(row[0]): row[1] for row in squad_rows}
            members = {row[0]: row[1] for row in member_rows}

            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
                },
                'body': json.dumps({'squads': squads, 'members': members})
            }

        if method == 'POST':
            body_data = json.loads(event.get('body') or '{}')
            squads_data = body_data.get('squads')
            members_data = body_data.get('members')

            if not isinstance(squads_data, dict) or not isinstance(members_data, dict):
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Некорректные параметры запроса'})
                }

            for squad_id_str, likes in squads_data.items():
                squad_id = int(squad_id_str)
                likes_value = max(0, int(likes))
                cur.execute(
                    """INSERT INTO squad_likes (squad_id, likes) VALUES (%s, %s)
                       ON CONFLICT (squad_id) DO UPDATE SET likes = EXCLUDED.likes""",
                    (squad_id, likes_value)
                )

            for member_id, likes in members_data.items():
                likes_value = max(0, int(likes))
                cur.execute(
                    """INSERT INTO member_likes (member_id, likes) VALUES (%s, %s)
                       ON CONFLICT (member_id) DO UPDATE SET likes = EXCLUDED.likes""",
                    (str(member_id), likes_value)
                )

            conn.commit()

            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'saved': True})
            }

        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()
