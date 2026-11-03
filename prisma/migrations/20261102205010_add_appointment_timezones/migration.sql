-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "startsAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "endsAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "confirmationExpiresAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "confirmedAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "cancelledAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "AppointmentBlock" ALTER COLUMN "startsAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "endsAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'America/Aruba';

-- Enable GiST support for UUID equality comparisons.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- An appointment cannot end before or at its start time.
ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_valid_time_range"
CHECK (
    "endsAt" IS NULL OR "endsAt" > "startsAt"
);

-- Confirmed, in-progress and completed appointments must have an end time.
ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_required_end_time"
CHECK (
    "status" NOT IN (
        'PENDING',
        'CONFIRMED',
        'IN_PROGRESS',
        'COMPLETED'
    )
    OR "endsAt" IS NOT NULL
);

-- Prevent overlapping appointments for the same veterinarian,
-- regardless of the branch.
-- Pending appointments reserve a provisional interval
-- through their endsAt value, assigned by the application.
ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_no_veterinarian_overlap"
EXCLUDE USING GIST (
    "veterinarianId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
)
WHERE (
    "status" IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
);

-- An appointment block must have a valid time range.
ALTER TABLE "AppointmentBlock"
ADD CONSTRAINT "AppointmentBlock_valid_time_range"
CHECK ("endsAt" > "startsAt");

-- Prevent overlapping blocks for the same staff member,
-- even when assigned to different branches.
ALTER TABLE "AppointmentBlock"
ADD CONSTRAINT "AppointmentBlock_no_staff_overlap"
EXCLUDE USING GIST (
    "staffId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
);

-- Ensure staff schedule times use the HH:mm format
-- and represent a valid positive time range.
ALTER TABLE "StaffSchedule"
ADD CONSTRAINT "StaffSchedule_valid_time_range"
CHECK (
    "startsAt" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND
    "endsAt" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND
    "startsAt" < "endsAt"
);