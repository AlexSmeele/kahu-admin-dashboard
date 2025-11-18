
-- One-time data update: Assign priority_order to skills with priority_order = 0
-- This orders skills logically by difficulty level and training progression

WITH ordered_skills AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      ORDER BY 
        difficulty_level ASC,
        CASE 
          WHEN category::text ILIKE '%Foundational%' THEN 1
          WHEN category::text ILIKE '%Focus%' THEN 2
          WHEN category::text ILIKE '%Engagement%' THEN 3
          WHEN category::text ILIKE '%Communication%' THEN 4
          WHEN category::text ILIKE '%Obedience%' THEN 5
          WHEN category::text ILIKE '%Safety%' THEN 6
          WHEN category::text ILIKE '%Impulse Control%' THEN 7
          WHEN category::text ILIKE '%Leash%' THEN 8
          WHEN category::text ILIKE '%House Training%' THEN 9
          WHEN category::text ILIKE '%Crate%' THEN 10
          WHEN category::text ILIKE '%Retrieve%' THEN 11
          WHEN category::text ILIKE '%Fun%' THEN 12
          ELSE 13
        END,
        name ASC
    ) + 14 as new_priority_order
  FROM skills
  WHERE priority_order = 0
)
UPDATE skills
SET priority_order = ordered_skills.new_priority_order
FROM ordered_skills
WHERE skills.id = ordered_skills.id;
