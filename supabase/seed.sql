-- CFBMS Seed Data
-- Demo facilities for testing and initial development

INSERT INTO facilities (name, facility_type, description, location, capacity, is_active)
VALUES
  (
    'Demo Classroom A',
    'classroom',
    'A standard demonstration classroom for meetings and academic activities. This is simulated data for the CFBMS academic project.',
    'Demo Building, Floor 1, Room 101',
    40,
    true
  ),
  (
    'Demo Classroom B',
    'classroom',
    'A smaller demonstration classroom suitable for committee meetings and study groups. This is simulated data for the CFBMS academic project.',
    'Demo Building, Floor 2, Room 201',
    25,
    true
  ),
  (
    'Demo FabLab',
    'fablab',
    'A demonstration fabrication laboratory for seminars, workshops, and collaborative activities. This is simulated data for the CFBMS academic project.',
    'Demo Innovation Center, Ground Floor',
    50,
    true
  );
