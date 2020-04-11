CREATE TABLE rules (
  id INT NOT NULL AUTO_INCREMENT,
  owner VARCHAR(255),
  repo VARCHAR(255),
  fileNamePattern VARCHAR(255),
  rulePattern VARCHAR(255),
  targetBranches VARCHAR(255),
  comment TEXT,
  PRIMARY KEY (id)
);