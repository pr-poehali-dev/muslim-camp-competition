CREATE TABLE IF NOT EXISTS squad_likes (
    squad_id INTEGER PRIMARY KEY,
    likes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS member_likes (
    member_id TEXT PRIMARY KEY,
    likes INTEGER NOT NULL DEFAULT 0
);

INSERT INTO squad_likes (squad_id, likes) VALUES
    (1, 0), (2, 0), (3, 0), (4, 0)
ON CONFLICT (squad_id) DO NOTHING;

INSERT INTO member_likes (member_id, likes) VALUES
    ('1-1', 0), ('1-2', 0), ('1-3', 0), ('1-4', 0), ('1-5', 0),
    ('2-1', 0), ('2-2', 0), ('2-3', 0), ('2-4', 0), ('2-5', 0), ('2-6', 0),
    ('3-1', 0), ('3-2', 0), ('3-3', 0), ('3-4', 0), ('3-5', 0),
    ('4-1', 0), ('4-2', 0), ('4-3', 0), ('4-4', 0), ('4-5', 0)
ON CONFLICT (member_id) DO NOTHING;