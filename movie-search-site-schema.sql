# Host: 127.0.0.1 (MySQL 8.0.19)
# Database: contentDB
# Generation Time: 2022-03-17 10:11:44 IST
# ************************************************************

create database contentDB;

SET NAMES utf8mb4;

# Dump of table movie
# ------------------------------------------------------------

DROP TABLE IF EXISTS contentDB.`movie`;

CREATE TABLE contentDB.`movie` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT '',
  `slug` varchar(10) NOT NULL DEFAULT '',
  `poster_urls` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `release_year` smallint DEFAULT NULL,
  `original_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `local_release_date` date DEFAULT NULL,
  `age_certification` varchar(5) DEFAULT NULL,
  `runtime` int DEFAULT NULL,
  `credits` json  DEFAULT NULL,
  `genres` json DEFAULT NULL,
  `clips` json  DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  unique (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS contentDB.`user_rating`;

CREATE TABLE contentDB.`user_rating` (
	`id` int unsigned NOT NULL AUTO_INCREMENT,
    `user_id` int unsigned NOT NULL,
    `movie_id` int unsigned NOT NULL,
    `rating` tinyint unsigned NOT NULL,
    `rating_creation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `rating_updation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

alter table contentDB.user_rating add unique key unique_user_movie(user_id,movie_id);
alter table contentDB.user_rating add foreign key (movie_id) references contentDB.movie(id);

select * from contentDB.user_rating;
select * from contentDB.movie where id=411;

select count(*) from contentDB.`movie`;

truncate table contentDB.user_rating;

select credits from contentDB.movie where slug='tm1';

SELECT age_certification FROM contentDB.movie WHERE slug='tm7';
delete from contentDB.user_rating where id=9;
