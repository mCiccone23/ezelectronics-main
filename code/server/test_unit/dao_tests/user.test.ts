import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"
import { Role, User } from "../../src/components/user"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

describe("Create user", () => {
    
    test("It should resolve true", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
        })
        const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
            return Buffer.from("hashedPassword")
        })
        const result = await userDAO.createUser("username", "name", "surname", "password", "role")
        expect(result).toBe(true)
        mockRandomBytes.mockRestore()
        mockDBRun.mockRestore()
        mockScrypt.mockRestore()
    
    
    })

    test("It should reject User Already Exist", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            const error = new Error("UNIQUE constraint failed: users.username");
            callback(error);
            return {} as Database
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
        })
        const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
            return Buffer.from("hashedPassword")
        })
        try {
            await userDAO.createUser("username", "name", "surname", "password", "role");
        } catch (error) {
            expect(error).toBeInstanceOf(UserAlreadyExistsError);
        }
        mockRandomBytes.mockRestore()
        mockDBRun.mockRestore()
        mockScrypt.mockRestore()
    
    
    })

    test("Get isUserAuthenticated handles error", async () => {
        const userDAO = new UserDAO();
        
        // Mock del metodo db.get per lanciare un'eccezione
        const mockDBGet = jest.spyOn(db, "run").mockImplementation(() => {
            throw new Error("Database error before callback");
        });
    
        try {
            await userDAO.createUser("username", "name", "surname", "password", "role");
        } catch (error) {
            expect(error).toEqual(new Error("Database error before callback"));
        }
    
        mockDBGet.mockRestore();
    })
})

describe("Get Users", () => {
    test("It should return all users", async () => {
        const userDAO = new UserDAO();
    
        const mockUsers = [
            { username: "user1", name: "Name1", surname: "Surname1", role: "Customer", address: "Address1", birthdate: "2000-01-01" },
            { username: "user2", name: "Name2", surname: "Surname2", role: "Admin", address: "Address2", birthdate: "1990-02-02" }
        ];
    
        // Mock db.all to return mockUsers
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            return callback(null, mockUsers)
        });
    
        const result = await userDAO.getUsers();
    
        expect(result).toHaveLength(mockUsers.length);
        expect(result[0]).toBeInstanceOf(User);
        expect(result[0].username).toBe(mockUsers[0].username);
        expect(result[1].username).toBe(mockUsers[1].username);
    
        // Clean up mocks
        mockDBAll.mockRestore();
    });

    test("It should handle errors", async () => {
        const userDAO = new UserDAO();
    
        // Mock db.all to return an error
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            return callback(new Error("Database error"));
        });
    
        await expect(userDAO.getUsers()).rejects.toThrow("Database error");
    
        // Clean up mocks
        mockDBAll.mockRestore();
    });

    test("Get users handles error", async () => {
        const userDAO = new UserDAO();
        
        // Mock del metodo db.get per lanciare un'eccezione
        const mockDBGet = jest.spyOn(db, "all").mockImplementation(() => {
            throw new Error("Database error before callback");
        });
    
        try {
            await userDAO.getUsers();
        } catch (error) {
            expect(error).toEqual(new Error("Database error before callback"));
        }
    
        mockDBGet.mockRestore();
    })

    
})

describe('Get users by role', () => {

    test("It should return users by role", async () => {
        const userDAO = new UserDAO();
    
        const mockUsers = [
            { username: "user1", name: "Name1", surname: "Surname1", role: "Customer", address: "Address1", birthdate: "2000-01-01" },
            { username: "user2", name: "Name2", surname: "Surname2", role: "Customer", address: "Address2", birthdate: "1990-02-02" }
        ];
    
        // Mock db.all to return mockUsers for role "Customer"
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            return callback(null, mockUsers);
        });
    
        const result = await userDAO.getUsersByRole("Customer");
    
        expect(result).toHaveLength(mockUsers.length);
        expect(result[0]).toBeInstanceOf(User);
        expect(result[0].role).toBe("Customer");
        expect(result[1].role).toBe("Customer");
    
        // Clean up mocks
        mockDBAll.mockRestore();
    });
    
    test("It should handle errors", async () => {
        const userDAO = new UserDAO();
    
        // Mock db.all to return an error
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            return callback(new Error("Database error"));
        });
    
        await expect(userDAO.getUsersByRole("Customer")).rejects.toThrow("Database error");
    
        // Clean up mocks
        mockDBAll.mockRestore();
    })

    test("Get users by role handles error", async () => {
        const userDAO = new UserDAO();
        
        // Mock del metodo db.get per lanciare un'eccezione
        const mockDBGet = jest.spyOn(db, "all").mockImplementation(() => {
            throw new Error("Database error before callback");
        });
    
        try {
            await userDAO.getUsersByRole("Customer");
        } catch (error) {
            expect(error).toEqual(new Error("Database error before callback"));
        }
    
        mockDBGet.mockRestore();
    })
 })

 describe("Get user by username", () => {

    test("It should return user by username", async () => {
        const userDAO = new UserDAO();

        const mockUser = { username: "user1", name: "Name1", surname: "Surname1", role: "Customer", address: "Address1", birthdate: "2000-01-01" };

        // Mock db.get to return mockUser
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, mockUser);
        });

        const result = await userDAO.getUserByUsername("user1");

        expect(result).toBeInstanceOf(User);
        expect(result.username).toBe(mockUser.username);

        // Clean up mocks
        mockDBGet.mockRestore();
    });

    test("It should reject UserNotFoundError if user does not exist", async () => {
        const userDAO = new UserDAO();

        // Mock db.get to return null, simulating user not found
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
           return callback(null, null);
        });

        await expect(userDAO.getUserByUsername("nonexistentuser")).rejects.toThrow(UserNotFoundError);

        // Clean up mocks
        mockDBGet.mockRestore();
    });

    test("It should handle errors in getUserByUsername", async () => {
        const userDAO = new UserDAO();

        // Mock db.get to return an error
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(new Error("Database error"));
        });

        await expect(userDAO.getUserByUsername("someuser")).rejects.toThrow("Database error");

        // Clean up mocks
        mockDBGet.mockRestore();
    });

    test("Get isUserAuthenticated handles error", async () => {
        const userDAO = new UserDAO();
        
        // Mock del metodo db.get per lanciare un'eccezione
        const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
            throw new Error("Database error before callback");
        });
    
        try {
            await userDAO.getUserByUsername("username");
        } catch (error) {
            expect(error).toEqual(new Error("Database error before callback"));
        }
    
        mockDBGet.mockRestore();
    })

 })

 describe("Delete un user", () => {
    test("It should delete user", async () => {
        const userDAO = new UserDAO();
    
        const mockUser = new User("username", "Name", "Surname", Role.CUSTOMER, "Address", "2000-01-01");
    
        // Mock db.run to return success
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, ...params) => {
            return {} as Database;
            
        });
    
        const result = await userDAO.deleteUser(mockUser, "username");
    
        expect(result).toBe(true);
    
        // Clean up mocks
        mockDBRun.mockRestore();
    });
    
    test("It should handle errors in deleteUser", async () => {
        const userDAO = new UserDAO();
    
        const mockUser = new User("username", "Name", "Surname", Role.CUSTOMER, "Address", "2000-01-01");
    
        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            return callback(new Error("Database error"))
        });
    
        await expect(userDAO.deleteUser(mockUser, "username")).rejects.toThrow("Database error");
    
        // Clean up mocks
        mockDBRun.mockRestore();
    });

    test("Delete user handles error", async () => {
        const userDAO = new UserDAO();
        
        // Mock del metodo db.get per lanciare un'eccezione
        const mockDBGet = jest.spyOn(db, "run").mockImplementation(() => {
            throw new Error("Database error before callback");
        });
    
        try {
            await userDAO.deleteUser(new User("username", "Name", "Surname", Role.CUSTOMER, "Address", "2000-01-01"), "username");
        } catch (error) {
            expect(error).toEqual(new Error("Database error before callback"));
        }
    
        mockDBGet.mockRestore();
    })
 })

 describe('delete all users', () => {

    test("It should delete user", async () => {
        const userDAO = new UserDAO();
    
        // Mock db.run to return success
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, ...params) => {
            return {} as Database;
            
        });
    
        const result = await userDAO.deleteAll();
    
        expect(result).toBe(true);
    
        // Clean up mocks
        mockDBRun.mockRestore();
    });
    
    test("It should handle errors in deleteUser", async () => {
        const userDAO = new UserDAO();

    
        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            return callback(new Error("Database error"))
        });
    
        await expect(userDAO.deleteAll()).rejects.toThrow("Database error");
    
        // Clean up mocks
        mockDBRun.mockRestore();
    });

    test("Delete user handles error", async () => {
        const userDAO = new UserDAO();
        
        // Mock del metodo db.get per lanciare un'eccezione
        const mockDBGet = jest.spyOn(db, "run").mockImplementation(() => {
            throw new Error("Database error before callback");
        });
    
        try {
            await userDAO.deleteAll();
        } catch (error) {
            expect(error).toEqual(new Error("Database error before callback"));
        }
    
        mockDBGet.mockRestore();
    })
 })


 describe('update user', () => {

    test("It should update user", async () => {
        const userDAO = new UserDAO();

        const mockUser = new User("username", "Name", "Surname", Role.CUSTOMER, "Address", "2000-01-01");
    
        // Mock db.run to return success
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        const result = await userDAO.updateUserInfo(mockUser, "NewName", "NewSurname", "NewAddress", "2001-01-01", "username");

        expect(result).toEqual(new User("username", "NewName", "NewSurname", Role.CUSTOMER, "NewAddress", "2001-01-01"));

        // Clean up mocks
        mockDBRun.mockRestore();
    });
    
    test("It should handle errors in update", async () => {
        const userDAO = new UserDAO();

        const mockUser = new User("username", "Name", "Surname", Role.CUSTOMER, "Address", "2000-01-01");
    
        // Mock db.run to return an error
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as Database;
        });

        await expect(userDAO.updateUserInfo(mockUser, "NewName", "NewSurname", "NewAddress", "2001-01-01", "username"))
            .rejects.toThrow("Database error");

        // Clean up mocks
        mockDBRun.mockRestore()
    });

    test("It should throw 401 error for unauthorized access", async () => {
        const userDAO = new UserDAO();
        const mockUser = new User("anotherUsername", "Name", "Surname", Role.CUSTOMER, "Address", "2000-01-01");

        await expect(userDAO.updateUserInfo(mockUser, "NewName", "NewSurname", "NewAddress", "2001-01-01", "username"))
            .rejects.toThrow("Unauthorized access");
    });

 })
describe("Get isUserAuthenticated", () => {
    test("Get isUserAutenticated user not found", async () => {
        const userDAO = new UserDAO();
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            return callback(null, null);
        });
        const result = await userDAO.getIsUserAuthenticated("username", "password");
        expect(result).toBe(false);
        mockDBGet.mockRestore();
    })
    
    test("Get isUserAuthenticated handles error", async () => {
        const userDAO = new UserDAO();
        
        // Mock del metodo db.get per lanciare un'eccezione
        const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
            throw new Error("Database error before callback");
        });
    
        try {
            await userDAO.getIsUserAuthenticated("username", "password");
        } catch (error) {
            expect(error).toEqual(new Error("Database error before callback"));
        }
    
        mockDBGet.mockRestore();
    });
})
 