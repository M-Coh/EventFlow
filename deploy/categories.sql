INSERT INTO categories (id, name) VALUES
  (1, 'Koncerti'),
  (2, 'Šport'),
  (3, 'Izobraževanje'),
  (4, 'Kultura'),
  (5, 'Drugo');

SELECT setval(pg_get_serial_sequence('categories', 'id'), 5);
