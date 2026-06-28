-- DropForeignKey
ALTER TABLE "CommentLike" DROP CONSTRAINT "CommentLike_commentId_fkey";

-- DropForeignKey
ALTER TABLE "CommentLike" DROP CONSTRAINT "CommentLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "LikeJournel" DROP CONSTRAINT "LikeJournel_journelId_fkey";

-- DropForeignKey
ALTER TABLE "LikeJournel" DROP CONSTRAINT "LikeJournel_userId_fkey";

-- DropForeignKey
ALTER TABLE "MeditationListener" DROP CONSTRAINT "MeditationListener_meditationId_fkey";

-- DropForeignKey
ALTER TABLE "MeditationListener" DROP CONSTRAINT "MeditationListener_userId_fkey";

-- DropForeignKey
ALTER TABLE "MurmurationLike" DROP CONSTRAINT "MurmurationLike_murmurationId_fkey";

-- DropForeignKey
ALTER TABLE "MurmurationLike" DROP CONSTRAINT "MurmurationLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_reply_to_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "digs" DROP CONSTRAINT "digs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "favorite_meditation" DROP CONSTRAINT "favorite_meditation_meditation_id_fkey";

-- DropForeignKey
ALTER TABLE "favorite_meditation" DROP CONSTRAINT "favorite_meditation_user_id_fkey";

-- DropForeignKey
ALTER TABLE "murmuration_bookmarks" DROP CONSTRAINT "murmuration_bookmarks_murmurationId_fkey";

-- DropForeignKey
ALTER TABLE "murmuration_bookmarks" DROP CONSTRAINT "murmuration_bookmarks_userId_fkey";

-- AddForeignKey
ALTER TABLE "LikeJournel" ADD CONSTRAINT "LikeJournel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikeJournel" ADD CONSTRAINT "LikeJournel_journelId_fkey" FOREIGN KEY ("journelId") REFERENCES "journels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MurmurationLike" ADD CONSTRAINT "MurmurationLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MurmurationLike" ADD CONSTRAINT "MurmurationLike_murmurationId_fkey" FOREIGN KEY ("murmurationId") REFERENCES "murmurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "murmuration_bookmarks" ADD CONSTRAINT "murmuration_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "murmuration_bookmarks" ADD CONSTRAINT "murmuration_bookmarks_murmurationId_fkey" FOREIGN KEY ("murmurationId") REFERENCES "murmurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_reply_to_comment_id_fkey" FOREIGN KEY ("reply_to_comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationListener" ADD CONSTRAINT "MeditationListener_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationListener" ADD CONSTRAINT "MeditationListener_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "meditation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_meditation" ADD CONSTRAINT "favorite_meditation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_meditation" ADD CONSTRAINT "favorite_meditation_meditation_id_fkey" FOREIGN KEY ("meditation_id") REFERENCES "meditation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digs" ADD CONSTRAINT "digs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
