CREATE DATABASE IF NOT EXISTS camp_reservations
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE camp_reservations;

CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_name VARCHAR(80) NOT NULL,
  display_name VARCHAR(20) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  people INT UNSIGNED NOT NULL,
  equipment TEXT NOT NULL,
  message TEXT NULL,
  status ENUM('pending', 'confirmed', 'canceled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_reservation_dates (start_date, end_date),
  INDEX idx_reservation_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
