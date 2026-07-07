# Plan — new games + fullscreen checkpoints

I'll add four new teacher-configurable games, restructure the Games hub, and make video checkpoint questions display fullscreen. Existing designs, layouts, and other features stay as they are.

## 1. Quiz Match (rework of current "Match It!")

- Teacher builds question sets: uploads a **prompt image** (e.g. frog) + a question text (default: "What do I eat?") + 2–4 **choice images** and marks one as correct.
- Student sees prompt image + question, taps a choice image; correct answer awards points.
- Move the entry from the top-level `/matching` tab into the Games hub tile grid; remove the standalone tab from the student header. Keep the route so old links still work.

## 2. Arrange the Order (drag-and-drop food chain)

- Teacher builds a chain: uploads N ordered images (☀️ → Rice Plant → Grasshopper → Frog → Snake). Reorder with ↑/↓ like current trace admin.
- Student view: images are scattered randomly at the top; a horizontal slot rail sits below. Student drags each image into the correct slot. "Check" validates order.
- Replaces the "Trace the food chain" game entry (arrow-drawing) since the user described this as the replacement flow.

## 3. Trace the Animal (finger-tracing + classify)

- Teacher uploads a single outline image per animal + picks its category (herbivore / carnivore / omnivore).
- Student view: canvas with the outline image as background; finger/mouse draws on an overlay canvas. **Eraser** and **Clear** buttons.
- "Done" → fullscreen popup: "Is this a Herbivore, Carnivore, or Omnivore?" with three buttons. Correct = award points.

## 4. Connect the Pairs

- Teacher uploads paired images (left item ↔ right item), e.g. carrot ↔ rabbit.
- Student view: left column and right column, shuffled. Tap a left dot, then a right dot to draw a connecting line. When all correct pairs are drawn, award points.

## 5. Fullscreen video checkpoints

- In `play.$videoId.tsx`, when a checkpoint fires, pause the video and render the question as a **fullscreen modal overlay** (fixed inset-0, high z-index, large text, big answer buttons). Resume video only after answer submitted.

## Database (one migration)

New tables (all with GRANTs + RLS matching existing teacher-open pattern used by `trace_chains`):

- `quiz_match_questions` (prompt_image_path, question_text)
- `quiz_match_choices` (question_id, image_path, is_correct)
- `arrange_chains` (title) + `arrange_items` (chain_id, image_path, position)
- `trace_animals` (image_path, label, category: herbivore|carnivore|omnivore)
- `connect_sets` (title) + `connect_pairs` (set_id, left_image_path, right_image_path)

Each game also gets a leaderboard row via existing `group_game_scores` (extend allowed `game` values).

## Files

- New teacher admin pages: `teacher.quizmatch.tsx`, `teacher.arrange.tsx`, `teacher.traceanimal.tsx`, `teacher.connect.tsx`.
- New student game pages: `games.quizmatch.tsx`, `games.arrange.tsx`, `games.traceanimal.tsx`, `games.connect.tsx`.
- Update `games.index.tsx` to list all games including Match It; remove `/matching` from student header nav.
- Update `teacher.index.tsx` to link the 4 new admin pages.
- Update `play.$videoId.tsx` for fullscreen checkpoint modal.
- Update `App.tsx` route table.
- Extend `awardGameScore` game keys.

## Out of scope

- No changes to visual style, layout, offline cache logic, or Ionic/Capacitor setup.
- Existing trace-arrow game stays reachable but no longer featured (replaced by Arrange in the hub).
