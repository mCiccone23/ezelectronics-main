import { describe, test, expect, beforeAll, afterAll, jest, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
const baseURL = "/ezelectronics"
import { validationResult } from 'express-validator';
import { UserAlreadyExistsError, UserIsAdminError, UserNotAdminError, UserNotFoundError, } from "../../src/errors/userError"
import { Server, IncomingMessage, ServerResponse, get } from "http"
import { DateError } from "../../src/utilities"
import { rejects } from "assert"


//For unit tests, we need to validate the internal logic of a single component, without the need to test the interaction with other components
//For this purpose, we mock (simulate) the dependencies of the component we are testing
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")

afterEach(() => {
    jest.restoreAllMocks(); // Ripristina tutti i mock dopo ogni test
  });
//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters
describe("Create user route tests", () => {

    test("It should return a 200 success code", async () => {
        const testUser = { //Define a test user object sent to the route
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isEmpty: () => ({ isLength: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
            })),
        }))

        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })

        jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
        //Check if the createUser method has been called with the correct parameters
        expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role)
    })

    test("It should return a 503 error code on failure", async () => {
        const testUser = {
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        };

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isEmpty: () => ({ isLength: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
            })),
        }));

        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next();
        });

        // Mock the createUser method to throw an error
        const testController=jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new Error());
        

        const response = await request(app).post(baseURL + "/users").send(testUser);
        expect(response.error);
        expect(testController).toHaveBeenCalled();
        expect(testController).toHaveBeenCalledWith(
            testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role
        );
    });

    test("Error 422 - user empty", async () => {

        const testUser = { 
            username: "",
            name: "test",
            surname: "test",
            password: "testsss",
            role: "Manager"
        }

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isEmpty: () => ({ isLength: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
            })),
        }))

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 422
    })

    test("Error 422 - name empty", async () => {

        const testUser = { 
            username: "test",
            name: "",
            surname: "test",
            password: "test",
            role: "Manager"
        }

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isEmpty: () => ({ isLength: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
            })),
        }))

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 422
    })

    test("Error 422 - surname empty", async () => {

        const testUser = { 
            username: "test",
            name: "test",
            surname: "",
            password: "test",
            role: "Manager"
        }

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isEmpty: () => ({ isLength: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
            })),
        }))
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 422
    })
    
    test("Error 422 - password empty", async () => {

        const testUser = { 
            username: "test",
            name: "test",
            surname: "test",
            password: "",
            role: "Manager"
        }

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isEmpty: () => ({ isLength: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
            })),
        }))
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(false) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 422

        
    })

    test("Error 422 - role not in [Customer, Manager, Admin", async () => {

        const testUser = { 
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Commesso"
        }

        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isEmpty: () => ({ isLength: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
            })),
        }))

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }
            next();
          });

        jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 422

    })
    /*
    test("Errore 409 - User already exists", async () => {
        const inputUser = { username: "test", name: "test", surname: "test", password: "test", role: "Manager" }
        //We mock the express-validator 'body' method to return a mock object with the methods we need to validate the input parameters
        //These methods all return an empty object, because we are not testing the validation logic here (we assume it works correctly)
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isEmpty: () => ({ isLength: () => ({}) }),
                isIn: () => ({ isLength: () => ({}) }),
            })),
        }))
        //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })
        //We mock the UserController createUser method to return false, because we are not testing the UserController logic here (we assume it works correctly)
       const mockCreate = jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError())
        const response = await request(app).post(baseURL + "/users/").send(inputUser)
        expect(response.status).toBe(409)
        expect(UserController.prototype.createUser).toHaveBeenCalledWith(inputUser.username, inputUser.name, inputUser.surname, inputUser.password, inputUser.role)
        
        mockCreate.mockRestore();
    })
        */
})

describe("Get all users tests", () => {
    afterEach(() => {
        jest.restoreAllMocks(); // Ripristina tutti i mock dopo ogni test
      });
    test("Correct", async () => {

        const lista_users = [new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("Mario Rossi", "Mario", "Rossi",  Role.MANAGER,  "via della liberazione", "2002-10-11"),]

        const getUsersMock = jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(lista_users)
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testAdmin.username
            return next();
           })
        const isAdminMock =  jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return  next();
            })
        const response = await request(app).get(baseURL + "/users") //GET request
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(UserController.prototype.getUsers).toHaveBeenCalled()
        expect(response.body).toEqual(lista_users)

        getUsersMock.mockRestore();
        isLoggedMock.mockRestore();
        isAdminMock.mockRestore();

    })

    test("It should return 503 Internal Server Error", async () => {

        const getUsersMock = jest.spyOn(UserController.prototype, "getUsers").mockRejectedValue(new Error())
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
            })
        const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return next();
            })
        const response = await request(app).get(baseURL + "/users") //GET request
        expect(response.error)
        expect(UserController.prototype.getUsers).toHaveBeenCalled()

        getUsersMock.mockRestore();
        isLoggedMock.mockRestore();
        isAdminMock.mockRestore();
    })

    test("User is not admin", async () => {

        const lista_users = [new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("MRossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("MarioR", "Mario", "Rossi",  Role.MANAGER,  "via della liberazione", "2002-10-11"),]

         const getUsersMock = jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(lista_users)
         const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
            })
         const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
        const response = await request(app).get(baseURL + "/users") //GET request
        expect(response.status).toBe(401) //Check if the response status is 401
        

    })

    test("User not logged", async () => {

        const lista_users = [new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("MRossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("MarioR", "Mario", "Rossi",  Role.MANAGER,  "via della liberazione", "2002-10-11"),]

         const getUsersMock = jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(lista_users)
         const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
         const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
        const response = await request(app).get(baseURL + "/users") //GET request
        expect(response.status).toBe(401) //Check if the response status is 401
        

    })
})


describe('get user by username', () => {

    test('It should return 200 if the user exists - Admin case', async () => {
        
        const user = new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")
        const getUserByUsernameMock = jest.spyOn(UserController.prototype, 'getUserByUsername').mockResolvedValueOnce(user)
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
            })
         const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return next();
            })

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            return next()
        })

        const response = await request(app).get(baseURL + "/users/" + user.username)
        expect(response.status).toBe(200)
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalled()
        expect(response.body).toEqual(user)
    })

    test("It should return 503 error code on failure", async () => {
        const user = new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")
        const getUserByUsernameMock = jest.spyOn(UserController.prototype, 'getUserByUsername').mockRejectedValueOnce(new Error())
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
            })
         const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return next();
            })

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            return next()
        })
        const response = await request(app).get(baseURL + "/users/" + user.username)
        expect(response.error)
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalled()

        getUserByUsernameMock.mockRestore();
        isLoggedMock.mockRestore();
        isAdminMock.mockRestore();
    })

    test('It should return 404 if the user does not exist - Admin case', async () => {

        const user = new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")
        const getUserByUsernameMock = jest.spyOn(UserController.prototype, 'getUserByUsername').mockRejectedValueOnce(new UserNotFoundError)
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
            })
         const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return next();
            })

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            return next()
        })

        const response = await request(app).get(baseURL + "/users/" + user.username)
        expect(response.status).toBe(404)
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalled()
    })

    test('It should return 401 if the username is not equal to the username of the logged user - Customer case', async () => {
        

        const user = new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")
        const getUserByUsernameMock = jest.spyOn(UserController.prototype, 'getUserByUsername').mockRejectedValueOnce(new UserNotAdminError)
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
            })
         const isAdminMock = jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
         })
        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            return next()
        }) 

        const response = await request(app).get(baseURL + "/users/" + user.username)
        expect(response.status).toBe(401)
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalled()
    })
})




describe("Get users by Role", () => {

    afterEach(() => {
        jest.restoreAllMocks(); // Ripristina tutti i mock dopo ogni test
      });
    test("Correct", async () => {

        const lista_users = [new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("MarioRossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")]

        const getUsersByRoleMock = jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(lista_users)
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
            })
         const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return next();
            })

        jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            return next()
        })

        const response = await request(app).get(baseURL + "/users/roles/Customer")
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalled()
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("Customer")
            expect(response.body).toEqual(lista_users)

    })

    test("It should return 503 Internal Server Error", async () => {

        const getUsersByRoleMock = jest.spyOn(UserController.prototype, "getUsersByRole").mockRejectedValueOnce(new Error())
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).get(baseURL + "/users/roles/Customer")
        expect(response.error)
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalled()

        getUsersByRoleMock.mockRestore();
        isLoggedMock.mockRestore();
        isAdminMock.mockRestore();
    })
    test("It should fail if the role is not valid", async () => {
        //In this case we are testing a scenario where the role parameter is not among the three allowed ones
        //We need the 'isAdmin' method to return the next function, because the route checks if the user is an Admin before validating the role
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return next();
        })
        //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => {
                throw new Error("Invalid value");
            }),
        }));
        //We mock the 'validateRequest' method to receive an error and return a 422 error code, because we are not testing the validation logic here (we assume it works correctly)
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
        })
        //We call the route with dependencies mocked to simulate an error scenario, and expect a 422 code
        const response = await request(app).get(baseURL + "/users/roles/Invalid")
        expect(response.status).toBe(422)
    })

    test("It should fail if the user is not logged as Admin", async () => {
        const lista_users = [new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("MRossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")]

         const getUsersMock = jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(lista_users)
         const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
            })
         const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
        const response = await request(app).get(baseURL + "/users") //GET request
        expect(response.status).toBe(401) //Check if the response status is 401
    })
})

describe("Delete a specific user", () => {
    test("It should return 200", async () => {

        const delUser = new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");
        const deleteUserMock = jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user == testAdmin.username;
            return next();
            })
        const response = await request(app).delete(baseURL + "/users/" + delUser.username)
        expect(response.status).toBe(200)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()
    
    })

    test("It should return a 404 error - user do not exist", async () => {

        const delUser = new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");
        const deleteUserMock = jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UserNotFoundError);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user == testAdmin.username;
            return next();
            })
        const response = await request(app).delete(baseURL + "/users/" + delUser.username)
        expect(response.status).toBe(404)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()

    })
    test("It should return a 401 error - user not equal, when caller is not Admin", async () => {

        const delUser = new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");
        const deleteUserMock = jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UserNotAdminError);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user == testAdmin.username;
            return next();
            })
        const response = await request(app).delete(baseURL + "/users/" + delUser.username)
        expect(response.status).toBe(401)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()

    })
    test("It should return a 401 error - user to delete is Admin, when caller is Admin", async () => {

        const delUser = new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");
        const deleteUserMock = jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UserIsAdminError);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user == testAdmin.username;
            return next();
            })
        const response = await request(app).delete(baseURL + "/users/" + delUser.username)
        expect(response.status).toBe(401)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()

    })
})

describe("delete all users", () => {
    test("It should return 200", async () => {

        const deleteUserMock = jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValue(true);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user == testAdmin.username;
            return next();
            })
            const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
                })
            const response = await request(app).delete(baseURL + "/users")
            expect(response.status).toBe(200)
            expect(UserController.prototype.deleteUser).toHaveBeenCalled()
        
    })

    test("It should return 503 Internal Server Error", async () => {

        const deleteUserMock = jest.spyOn(UserController.prototype, "deleteAll").mockRejectedValue(new Error());
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user == testAdmin.username;
            return next();
            })
        const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return next();
            })
        const response = await request(app).delete(baseURL + "/users")
        expect(response.error)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()
    })

    test("It should return 401 error - User is not an Admin", async () => {

        const deleteUserMock = jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValue(true);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user == testAdmin.username;
            return next();
            })
            const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
                })
            const response = await request(app).delete(baseURL + "/users")
            expect(response.status).toBe(401)
            expect(UserController.prototype.deleteUser).toHaveBeenCalled()
        
    })

    test("It should return 401 error - User is not Logged", async () => {

        const deleteUserMock = jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValue(true);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
            })
            const isAdminMock = jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
                })
            const response = await request(app).delete(baseURL + "/users")
            expect(response.status).toBe(401)
            expect(UserController.prototype.deleteUser).toHaveBeenCalled()
        
    })

})

describe('Update user', () => {

    

    test("It should return 200", async () => {
        const testUser = new User("MarioR", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");
        const getUserByUsernameMock = jest.spyOn(UserController.prototype, 'getUserByUsername').mockResolvedValue(testUser);
        const updateUserMock = jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(testUser);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user === testUser.username;
            return next();
            })
            const validateRequestMock = jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
       
        });
        const response = await request(app).patch(baseURL + "/users/" + testUser.username).send({name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "2001-02-02"})
        expect(response.status).toBe(200)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()
    })

    test("It should return 422 - name empty", async () => {
        const testUser = new User( "MarioR", "", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");
        const updateUserMock = jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(testUser);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user === testUser.username;
            return next();
            })
        const validateRequestMock = jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: "Name is empty" });
       
        });
        const response = await (await request(app).patch(baseURL + "/users/" + testUser.username).send({name: "", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "2001-02-02"}))
        expect(response.status).toBe(422)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()
    })

    test("It should return 422 - surname empty", async () => {
        const testUser = new User( "MarioR", "Mario", "",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");
        const updateUserMock = jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(testUser);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user === testUser.username;
            return next();
            })
        const validateRequestMock = jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: "Surname is empty" });
       
        });
        const response = await request(app).patch(baseURL + "/users/" + testUser.username).send({name: "admin", surname: "", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "2001-02-02"})
        expect(response.status).toBe(422)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()
    })

    test("It should return 422 - birthdate empty", async () => {
        const testUser = new User( "MarioR", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "");
        const updateUserMock = jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(testUser);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user === testUser.username;
            return next();
            })
        const validateRequestMock = jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: "Surname is empty" });
       
        });
        const response = await (await request(app).patch(baseURL + "/users/" + testUser.username).send({name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: ""}));
        expect(response.status).toBe(422)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()
    })

    test("It should return 422 - birthdate format non valid", async () => {
        const testUser = new User( "MarioR", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "02-02-2001");
        const updateUserMock = jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(testUser);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user === testUser.username;
            return next();
            })
        const validateRequestMock = jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ errors: "birthdate format not valid" });
       
        });
        const response = await request(app).patch(baseURL + "/users/" + testUser.username).send({name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "02-02-2000"})
        expect(response.status).toBe(422)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled()
    })

    test("It should return 404 - user does not exist", async () => {
        const testUser = new User("MarioR", "Mario", "Rossi", Role.CUSTOMER, "via della liberazione", "2001-02-02");
    
        // Mock the updateUserInfo method to throw UserNotFoundError
        const updateUserMock = jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new UserNotFoundError());
        // Mock the isLoggedIn method to simulate a logged-in user
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = { username: "testAdmin" }; // Simula un utente loggato
            return next();
        });
    
        // Mock the validateRequest method to bypass validation
        const validateRequestMock = jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
            return next();
        });
    
        // Send PATCH request
        const response = await request(app).patch(`${baseURL}/users/${testUser.username}`).send({
            name: "admin",
            surname: "admin",
            address: "Corso Duca degli Abruzzi 129, Torino",
            birthdate: "2001-02-02"
        });
    
        // Assert the response status
        expect(response.status).toBe(404);
    
        // Ensure updateUserInfo was called
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalled();
    
        // Clean up mocks
        updateUserMock.mockRestore();
        isLoggedMock.mockRestore();
        validateRequestMock.mockRestore();
    });

    test("It should return 404 - user do not correspond", async () => {
        const testUser = new User( "MarioR", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2001-02-02");
        const updateUserMock = jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new UserNotAdminError);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testCustomer.username};
            return next();
            })
        const validateRequestMock = jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
        });
        const response = await request(app).patch(`${baseURL}/users/${testUser.username}`).send({name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "2001-02-02"}); 
        expect(response.status).toBe(401)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled() 
        
        // Clean up mocks
        updateUserMock.mockRestore();
        isLoggedMock.mockRestore();
        validateRequestMock.mockRestore();
    })

    test("It should return 400 - birthdate after current date", async () => {
        const testUser = new User( "MarioR", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2001-02-02");
        const updateUserMock = jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new DateError);
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testCustomer.username};
            return next();
            })
        const validateRequestMock = jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
        });
        const response = await request(app).patch(`${baseURL}/users/${testUser.username}`).send({name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "2025-02-02"}); 
        expect(response.status).toBe(400)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled() 
        
        // Clean up mocks
        updateUserMock.mockRestore();
        isLoggedMock.mockRestore();
        validateRequestMock.mockRestore();
    })

    test("It should return 401 - username not equal to caller", async () => {
        const testUser = new User( "MarioR", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2001-02-02");
        const updateUserMock = jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new UserNotAdminError());
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : testCustomer.username};
            return next();
            })
        const validateRequestMock = jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
        });
        const response = await request(app).patch(`${baseURL}/users/${testUser.username}`).send({name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "2022-02-02"}); 
        expect(response.status).toBe(401)
        expect(UserController.prototype.deleteUser).toHaveBeenCalled() 
        
        // Clean up mocks
        updateUserMock.mockRestore();
        isLoggedMock.mockRestore();
        validateRequestMock.mockRestore();
    })
    
})

describe("Login", () => {

    test("It should return 401 - user do not exist", async () => {

        const loginUser = new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");
        const loginUserMock = jest.spyOn(Authenticator.prototype, "login").mockImplementation((req, res, next) => {
            return res.status(401).send();
        })
        const response = await request(app).post(baseURL + "/sessions").send({username: loginUser.username, password: "pass"});
        expect(response.status).toBe(401)
        
    
    })
});
describe("Get utente loggato", () => {

    test("It should return 200", async () => {

        const loginUser = new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");
        const loginUserMock = jest.spyOn(Authenticator.prototype, "login").mockImplementation((req, res, next) => {
            return res.status(200).send();
        })
        const isLoggedMock = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = {username : loginUser.username};
            return next();
            })
        const response = await request(app).get(baseURL + "/sessions/current");
        expect(response.status).toBe(200)
       
    })
})

