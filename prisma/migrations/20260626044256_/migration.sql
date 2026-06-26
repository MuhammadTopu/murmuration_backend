-- CreateTable
CREATE TABLE "Evaction" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "source_title" TEXT,
    "question" TEXT,
    "answer" TEXT,
    "username" TEXT,
    "user_id" TEXT,

    CONSTRAINT "Evaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Evaction" ADD CONSTRAINT "Evaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
