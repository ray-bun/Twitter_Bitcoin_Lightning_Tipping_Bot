-- -------------------------------------------------------------
-- TablePlus 4.2.0(388)
--
-- https://tableplus.com/
--
-- Database: postgres
-- Generation Time: 2021-10-13 14:03:23.3310
-- -------------------------------------------------------------


-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."donations" (
    "id" int8 NOT NULL,
    "twitterUserID" varchar,
    "donationAmount" int8,
    "userScrenName" varchar,
    "idThread" varchar,
    "time" timestamp DEFAULT now(),
    "paid" bool DEFAULT false,
    PRIMARY KEY ("id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."pending_payout" (
    "id" int8 NOT NULL,
    "twitterUserID" varchar,
    "refTwitterId" varchar,
    "userScrenName" varchar,
    "refUserScrenName" varchar,
    "idThread" varchar,
    "donationAmount" int8,
    "paid" bool DEFAULT false,
    "fee" int8,
    "payoutKey" varchar,
    "time" timestamp DEFAULT now(),
    "tweet" json,
    PRIMARY KEY ("id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."powerofsatoshi" (
    "id" int8 NOT NULL,
    "twitterUserID" varchar,
    "refTwitterId" varchar,
    "userScrenName" varchar,
    "refUserScrenName" varchar,
    "idThread" varchar,
    "time" timestamp DEFAULT now(),
    "enabled" bool DEFAULT true,
    PRIMARY KEY ("id")
);

-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."users" (
    "id" int8 NOT NULL,
    "twitterUserID" varchar,
    "satAmount" int8,
    "fee" int8,
    "username" varchar,
    "date" timestamp DEFAULT now(),
    "followed" bool,
    "unfollowed" bool,
    "dead_acc" bool,
    PRIMARY KEY ("id")
);

