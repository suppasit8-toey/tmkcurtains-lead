-- Add contact_dept column to conversation_history
-- to track which department the conversation was with
ALTER TABLE conversation_history
ADD COLUMN contact_dept TEXT;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN conversation_history.contact_dept IS 'Department contacted: phone_main, purchase_dept, building_dept';
