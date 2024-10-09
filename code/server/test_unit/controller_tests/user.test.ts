import { test, expect, jest, describe } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"

import { UnauthorizedUserError, UserAlreadyExistsError, UserIsAdminError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError"
import { Role, User } from "../../src/components/user"

jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters
describe("create user", () => {
    test("It should return true", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
        const controller = new UserController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role);
        expect(response).toBe(true); //Check if the response is true
    });

    test("It should return User Already exist error", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserDAO.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError()); //Mock the createUser method of the DAO
        const controller = new UserController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        const response = await expect(controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role))
        .rejects
        .toThrow(UserAlreadyExistsError);

    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.createUser).toHaveBeenCalled();
        expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role);
        
    });
})

describe("get Users", () => {

    test("It should return Users", async () => {

        const lista_users = [new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("Mario Rossi", "Mario", "Rossi",  Role.MANAGER,  "via della liberazione", "2002-10-11"),]

       const getUsersMock =  jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(lista_users);

        const controller = new UserController();
        const response = await controller.getUsers();

        expect(UserDAO.prototype.getUsers).toHaveBeenCalled();
        expect(response).toEqual(lista_users)

        getUsersMock.mockRestore();

    });

    test("It should return error", async () => {
        const getUsersMock =  jest.spyOn(UserDAO.prototype, "getUsers").mockRejectedValueOnce(new Error());

        const controller = new UserController();
        await expect(controller.getUsers()).rejects.toThrow(Error);

        expect(UserDAO.prototype.getUsers).toHaveBeenCalled();

        getUsersMock.mockRestore();
    });
})

describe("Get users by role", () => {

    test("It should return Users", async () => {

        const lista_users = [new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),
        new User("Mario Rossi", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11"),]

       const getUsersMock =  jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(lista_users);

        const controller = new UserController();
        const response = await controller.getUsersByRole("Customer");

        expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalled();
        expect(response).toEqual(lista_users)

        getUsersMock.mockRestore();
    });

    test("It should return error", async () => {
        const getUsersMock =  jest.spyOn(UserDAO.prototype, "getUsersByRole").mockRejectedValueOnce(new Error());

        const controller = new UserController();
        await expect(controller.getUsersByRole("Customer")).rejects.toThrow(Error);

        expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalled();

        getUsersMock.mockRestore();
    });
})

describe("Get user by username", () => {

    test("It should return an User when user is Customer", async () => {

        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")
        

       const getUsersMock =  jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user);

        const controller = new UserController();
        const response = await controller.getUserByUsername(user, "MARIOROSSI");

        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
        expect(response).toEqual(user)

        getUsersMock.mockRestore();

    })

    test("It should return an User when user is Customer", async () => {

        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.ADMIN,  "via della liberazione", "2002-10-11")
        

       const getUsersMock =  jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user);

        const controller = new UserController();
        const response = await controller.getUserByUsername(user, "TEST");

        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
        expect(response).toEqual(user)

        getUsersMock.mockRestore();

    })

    test("It should return UnauthorizedUserError when username are different", async () => {

        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")
        

       const getUsersMock =  jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user);

        const controller = new UserController();
        const response = await expect(controller.getUserByUsername(user, "TEST")).rejects.toThrow(new UnauthorizedUserError());

        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(0);

        getUsersMock.mockRestore();

    })

    test("It should return User not found error", async () => {

        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.ADMIN,  "via della liberazione", "2002-10-11")
        
        const getUsersMock =  jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError());

        const controller = new UserController();
        await expect(controller.getUserByUsername(user, "TEST")).rejects.toThrow(UserNotFoundError);

        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();

        getUsersMock.mockRestore();
    });

    test("It should return generic error", async () => {

        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.ADMIN,  "via della liberazione", "2002-10-11")
        
        const getUsersMock =  jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new Error());

        const controller = new UserController();
        await expect(controller.getUserByUsername(user, "TEST")).rejects.toThrow(Error);

        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();

        getUsersMock.mockRestore();
    });


})

describe("delete user", () => {

    test("It should return true - customer case", async () => {
        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")

        const delUserMock =  jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
        const getUserMock =   jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user);

        const controller = new UserController();

        const response =  await controller.deleteUser(user, "MARIOROSSI");

        expect(UserDAO.prototype.deleteUser).toHaveBeenCalled();
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
        expect(response).toBe(true);

        getUserMock.mockRestore();
        delUserMock.mockRestore();

    })

    test("It should return true - admin case", async () => {
        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.ADMIN,  "via della liberazione", "2002-10-11")

        const delUser = new User("MARCOBIANCHI", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")

        const delUserMock =  jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
        const getUserMock =   jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(delUser);

        const controller = new UserController();

        const response =  await controller.deleteUser(user, delUser.username);

        expect(UserDAO.prototype.deleteUser).toHaveBeenCalled();
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
        expect(response).toBe(true);

        getUserMock.mockRestore();
        delUserMock.mockRestore();

    })

    test("It should return error - different user customer case", async () => {
        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")

        const delUser = new User("MARCOBIANCHI", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")

        
        
        const controller = new UserController();

        await expect(controller.deleteUser(user, delUser.username)).rejects.toThrow(UserNotAdminError);

        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
        

    })

    test("It should return error - same user admin case", async () => {
        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.ADMIN,  "via della liberazione", "2002-10-11")

        //const delUser = new User("MARCOBIANCHI", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11")
        
        const controller = new UserController();

        await expect(controller.deleteUser(user, user.username)).rejects.toThrow(UserIsAdminError);

        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
        

    })

    test("It should return error - same user admin case", async () => {
        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.ADMIN,  "via della liberazione", "2002-10-11")

        const delUser = new User("MARCOBIANCHI", "Mario", "Rossi",  Role.ADMIN,  "via della liberazione", "2002-10-11")

        const getUserMock =   jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(delUser);
        
        const controller = new UserController();

        await expect(controller.deleteUser(user, delUser.username)).rejects.toThrow(UserIsAdminError);

        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
        

        getUserMock.mockRestore();
        

    })
    
    test("It should return error - user not found", async () => {
        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.ADMIN,  "via della liberazione", "2002-10-11")

        const delUser = new User("MARCOBIANCHI", "Mario", "Rossi",  Role.ADMIN,  "via della liberazione", "2002-10-11")

        const getUserMock =   jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError);
        
        const controller = new UserController();

        await expect(controller.deleteUser(user, delUser.username)).rejects.toThrow(UserNotFoundError);

        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
        

        getUserMock.mockRestore();
        

    })
    


})

describe("delete all users", () => {

    test("It should return true", async () => {

        const delAllMock =   jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValueOnce(true);

        const controller = new UserController();

        const response = await controller.deleteAll();

        expect(UserDAO.prototype.deleteAll).toHaveBeenCalled();
        expect(response).toBe(true);

        delAllMock.mockRestore();
    });

    test("It should return error", async () => {

        const delAllMock =   jest.spyOn(UserDAO.prototype, "deleteAll").mockRejectedValueOnce(new Error());

        const controller = new UserController();

        await expect(controller.deleteAll()).rejects.toThrow(Error);

        expect(UserDAO.prototype.deleteAll).toHaveBeenCalled();

        delAllMock.mockRestore();
    });
})


describe("Update user info", () => {

    
    test("It should return updated user", async () => {
        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");

        const upUserMock =   jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValue(user);
    
        const controller = new UserController();
        
        const response = await controller.updateUserInfo(user, user.name, user.surname, user.address, user.birthdate, user.username)
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalled();
        expect(response).toBe(user);

        upUserMock.mockRestore();


    });

    test("It should return updated user - admin case with different username ", async () => {
        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.ADMIN,  "via della liberazione", "2002-10-11");

        const upUser = new User("MARIOROSSI", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");

        const upUserMock =   jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValue(upUser);
    
        const controller = new UserController();
        
        const response = await controller.updateUserInfo(user, upUser.name, upUser.surname, upUser.address, upUser.birthdate, upUser.username);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalled();

        expect(response).toBe(upUser);

        upUserMock.mockRestore();


    })

    test("It should return UserNotAdminError - user are different", async () => {
        const user = new User("MARIOROSSI", "Mario", "Rossi",  Role.CUSTOMER,  "via della liberazione", "2002-10-11");

        const upUserMock =   jest.spyOn(UserDAO.prototype, "updateUserInfo").mockRejectedValue(new UserNotAdminError());
    
        const controller = new UserController();
        
        const response = await expect(controller.updateUserInfo(user, user.name, user.surname, user.address, user.birthdate, "test")).rejects.toThrow(UserNotAdminError);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(0);

        upUserMock.mockRestore();


    })

})