-- CreateTable
CREATE TABLE "FavoriteEvaction" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "user_id" TEXT,
    "evaction_id" TEXT,

    CONSTRAINT "FavoriteEvaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteEvaction_user_id_evaction_id_key" ON "FavoriteEvaction"("user_id", "evaction_id");

-- AddForeignKey
ALTER TABLE "FavoriteEvaction" ADD CONSTRAINT "FavoriteEvaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteEvaction" ADD CONSTRAINT "FavoriteEvaction_evaction_id_fkey" FOREIGN KEY ("evaction_id") REFERENCES "Evaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
