CREATE DATABASE sistema;
USE sistema;

CREATE TABLE users(
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE vista(
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100)
);

INSERT INTO vista(name, email) VALUES('Poly', 'poly@gmail.com');
INSERT INTO users(username, password) VALUES('Poly', 'poly');


