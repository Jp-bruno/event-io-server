CREATE DATABASE project_events;
USE project_events;

CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(255) NOT NULL,
    user_image VARCHAR(500),
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL
);

CREATE TABLE Events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_title VARCHAR(255) NOT NULL,
    event_thumbnail VARCHAR(255),
    event_banner VARCHAR(255),
    event_host_id INT NOT NULL, 
    event_description VARCHAR(1000),
    event_resume VARCHAR(100),
    event_slug VARCHAR(100),
    event_location VARCHAR(100),
    event_date DATE,
    FOREIGN KEY (event_host_id) REFERENCES Users(id)
);

CREATE TABLE User_events (
    user_id INT,
    event_id INT,
    user_role ENUM('host', 'participant') NOT NULL,
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE
);
