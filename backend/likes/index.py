import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    """API для чтения и изменения баллов отрядов и участниц лагеря. Хранит данные в общей базе, доступной всем устройствам.
    Args: event с httpMethod, body, queryStringParameters; context с request_id
    Returns: HTTP response dict со списком баллов или результатом изменения
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
    conn.autocommit = True
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
            target_type = body_data.get('type')
            target_id = body_data.get('id')
            delta = body_data.get('delta')

            if target_type not in ('squad', 'member') or target_id is None or delta not in (1, -1):
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Некорректные параметры запроса'})
                }

            if target_type == 'squad':
                squad_id = int(target_id)
                cur.execute(
                    "UPDATE squad_likes SET likes = GREATEST(0, likes + %s) WHERE squad_id = %s RETURNING likes",
                    (delta, squad_id)
                )
                row = cur.fetchone()
                if row is None:
                    cur.execute(
                        "INSERT INTO squad_likes (squad_id, likes) VALUES (%s, GREATEST(0, %s)) RETURNING likes",
                        (squad_id, delta)
                    )
                    row = cur.fetchone()
                new_value = row[0]
            else:
                member_id = str(target_id)
                cur.execute(
                    "UPDATE member_likes SET likes = GREATEST(0, likes + %s) WHERE member_id = %s RETURNING likes",
                    (delta, member_id)
                )
                row = cur.fetchone()
                if row is None:
                    cur.execute(
                        "INSERT INTO member_likes (member_id, likes) VALUES (%s, GREATEST(0, %s)) RETURNING likes",
                        (member_id, delta)
                    )
                    row = cur.fetchone()
                new_value = row[0]

            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'likes': new_value})
            }

        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    finally:
        cur.close()
        conn.close()