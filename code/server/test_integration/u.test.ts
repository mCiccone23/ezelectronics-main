import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import db from "../src/db/db"
import UserDAO from "../src/dao/userDAO"
import { UserAlreadyExistsError, UserNotFoundError } from "../src/errors/userError"
import { Role, User } from "../src/components/user"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }


//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    jest.setTimeout(20000);
    const registeringManager = await request(app)
        .post(routePath + "/users")
        .send({username: "testManager", password: "testpassword", name: "tester", role: "Manager",surname: "Test"})
        expect(registeringManager.status).toBe(200);
    
        const registeringCustomer = await request(app)
        .post(routePath + "/users")
        .send({username: customer.username, password:customer.password, name: customer.name, role: "Customer",surname: customer.surname})
        expect(registeringCustomer.status).toBe(200);

        
    
        const registeringAdmin = await request(app)
        .post(routePath + "/users")
        .send({username: admin.username, password: admin.password, name: admin.name, role: "Admin",surname: admin.surname})
        expect(registeringAdmin.status).toBe(200);
})

//After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup()
    db.close();
})

//A 'describe' block is a way to group tests. It can be used to group tests that are related to the same functionality
//In this example, tests are for the user routes
//Inner 'describe' blocks define tests for each route
describe("User routes integration tests", () => {
    describe("POST /users", () => {
        //A 'test' block is a single test. It should be a single logical unit of testing for a specific functionality and use case (e.g. correct behavior, error handling, authentication checks)
        test("It should return a 200 success code and create a new user", async () => {
            //A 'request' function is used to send a request to the server. It is similar to the 'fetch' function in the browser
            //It executes an API call to the specified route, similarly to how the client does it
            //It is an actual call, with no mocking, so it tests the real behavior of the server
            //Route calls are asynchronous operations, so we need to use 'await' to wait for the response
            const custToRegister = { username: "custToRegister", name: "customer", surname: "customer", password: "customer", role: "Customer" }
            await request(app)
                .post(`${routePath}/users`) //The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
                .send(custToRegister) //In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
                .expect(200) //The 'expect' block is used to check the response status code. We expect a 200 status code for a successful operation
            //After the request is sent, we can add additional checks to verify the operation, since we need to be sure that the user is present in the database
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            
            //A possible way is retrieving all users and looking for the user we just created.
            const users = await request(app) //It is possible to assign the response to a variable and use it later. 
                .get(`${routePath}/users`)
                .set("Cookie", loginResponse.header["set-cookie"][0]) //Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
                expect(users.status).toBe(200)
            expect(users.body).toHaveLength(4) //Since we know that the database was empty at the beginning of our tests and we created two users (an Admin before starting and a Customer in this test), the array should contain only two users
            let cust = users.body.find((user: any) => user.username === customer.username) //We look for the user we created in the array of users
            expect(cust).toBeDefined() //We expect the user we have created to exist in the array. The parameter should also be equal to those we have sent
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
        })

        test("It should return a 409 error code if a user with the same username already exists", async () => {
                await request(app)
                    .post(`${routePath}/users`) //The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
                    .send(customer) //In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
                    .expect(409)
                const loginResponse = await request(app)
                    .post(routePath + "/sessions")
                    .send({username: admin.username, password: admin.password})
                    expect(loginResponse.status).toBe(200);
                const users = await request(app) //It is possible to assign the response to a variable and use it later. 
                    .get(`${routePath}/users`)
                    .set("Cookie", loginResponse.header["set-cookie"][0]) //Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
                    expect(users.status).toBe(200)
                expect(users.body).toHaveLength(4)     
        })

        //Tests for error conditions can be added in separate 'test' blocks.
        //We can group together tests for the same condition, no need to create a test for each body parameter, for example
        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app)
                .post(`${routePath}/users`)
                .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" }) //We send a request with an empty username. The express-validator checks will catch this and return a 422 error code
                .expect(422)
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "", surname: "test", password: "test", role: "Customer" }).expect(422) //We can repeat the call for the remaining body parameters
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "test", surname: "", password: "test", role: "Customer" }).expect(422) //We can repeat the call for the remaining body parameters
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "test", surname: "", password: "test", role: "Customer" }).expect(422) //We can repeat the call for the remaining body parameters
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "test", surname: "test", password: "", role: "Customer" }).expect(422) //We can repeat the call for the remaining body parameters
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "", surname: "test", password: "test", role: "Customerss" }).expect(422) //We can repeat the call for the remaining body parameters
        })
    })

    describe("GET /users", () => {
        test("It should return an array of users", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            const users = await request(app).get(`${routePath}/users`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(200)
            expect(users.body).toHaveLength(4)
            let cust = users.body.find((user: any) => user.username === customer.username)
            expect(cust).toBeDefined()
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
            let adm = users.body.find((user: any) => user.username === admin.username)
            expect(adm).toBeDefined()
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
            expect(adm.role).toBe(admin.role)
        })

        test("It should return a 401 error code if the user is not an Admin", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);
            await request(app).get(`${routePath}/users`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(401) //We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).get(`${routePath}/users`).expect(401) //We can also call the route without any cookie. The result should be the same
        })
    })

    describe("GET /users/roles/:role", () => {
        test("It should return an array of users with a specific role", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            const admins = await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(200)
            expect(admins.body).toHaveLength(1) //In this case, we expect only one Admin user to be returned
            let adm = admins.body[0]
            expect(adm.username).toBe(admin.username)
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
        })

        test("It should fail if the role is not valid", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            //Invalid route parameters can be sent and tested in this way. The 'expect' block should contain the corresponding code
            await request(app).get(`${routePath}/users/roles/Invalid`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(422)
        })

        test("It should return a 401 error code if the user is not an Admin", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);
            await request(app).get(`${routePath}/users/roles/Customer`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(401) //We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).get(`${routePath}/users`).expect(401) //We can also call the route without any cookie. The result should be the same
        })

        test("It should return a 401 error code if the user is not logged in", async () => {
            await request(app).get(`${routePath}/users/roles/Customer`).expect(401)
        })

    })

    describe("GET /users/:username", () => {
        test("It should return a user with a specific username - Admin case different users", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            const user = await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(200)
            expect(user.body.username).toBe(customer.username)
            expect(user.body.name).toBe(customer.name)
            expect(user.body.surname).toBe(customer.surname)
        })

        test("It should return a user with a specific username - Customer case same user" , async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);
            const user = await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(200)
            expect(user.body.username).toBe(customer.username)
            expect(user.body.name).toBe(customer.name)
            expect(user.body.surname).toBe(customer.surname)
        })

        test("It should return a 401 error code if the user is not equal to the logged in user", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);
            const user = await request(app).get(`${routePath}/users/custToRegister`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(401)
        })

        test("It should return a 404 when user not found", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            const user = await request(app).get(`${routePath}/users/InvalidUser`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(404)
        })
    })
    describe("DELETE /users/:username", () => {
        test("It should delete a user with a specific username - Admin case different users", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            const user = await request(app).delete(`${routePath}/users/custToRegister`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(200)
            const users = await request(app) //It is possible to assign the response to a variable and use it later. 
            .get(`${routePath}/users`)
            .set("Cookie", loginResponse.header["set-cookie"][0]) //Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
            expect(users.status).toBe(200)
        expect(users.body).toHaveLength(3) 
        })

        test("It should delete a user with a specific username - Customer case same user" , async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);
            const user = await request(app).delete(`${routePath}/users/${customer.username}`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(200)
            const registeringCustomer = await request(app)
            .post(routePath + "/users")
            .send({username: customer.username, password:customer.password, name: customer.name, role: "Customer",surname: customer.surname})
            expect(registeringCustomer.status).toBe(200);
        })

        test("It should return a 401 error code if the user is not equal to the logged in user", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);
            const user = await request(app).delete(`${routePath}/users/custToRegister`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(401)
        })

        test("It should return a 404 when user not found", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            const user = await request(app).delete(`${routePath}/users/InvalidUser`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(404)
        })

        test("It should return a 401 error when the calling user is Admin and the username represent an Admin", async () => {
            
            const admToRegister = { username: "admToRegister", name: "customer", surname: "customer", password: "customer", role: "Admin" }
            await request(app)
                .post(`${routePath}/users`) //The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
                .send(admToRegister) //In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
                .expect(200)
            
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            const user = await request(app).delete(`${routePath}/users/${admToRegister.username}`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(401)
        })
    })

    describe("DELETE /users", () => {
        test("It should delete all users", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            await request(app).delete(`${routePath}/users`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(200)
            const users = await request(app)
            .get(`${routePath}/users`)
            .set("Cookie", loginResponse.header["set-cookie"][0])
            expect(users.status).toBe(200)
            expect(users.body).toHaveLength(2)
        })

        test("It should return a 401 error code if the user is not an Admin", async () => {
            await request(app)
                .post(`${routePath}/users`) //The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
                .send(customer) //In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
                .expect(200)
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);
            const user = await request(app).delete(`${routePath}/users`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(401)
        })
    })

    describe("PATH /users/:username", () => {
        test("It should update a user with a specific username - Admin case different users", async () => {
            
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            await request(app).patch(`${routePath}/users/customer`).set("Cookie", loginResponse.header["set-cookie"][0])
            .send({name: "updatedcustomer", surname: "updatedcustomer",address: "address", birthdate: "2000-01-01"}).expect(200)
            const user = await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(200)
            expect(user.body.name).toBe("updatedcustomer")
            expect(user.body.surname).toBe("updatedcustomer")
            expect(user.body.address).toBe("address")
            expect(user.body.birthdate).toBe("2000-01-01")
        })

        test("It should update a user with a specific username - Customer case same user" , async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);
            await request(app).patch(`${routePath}/users/customer`).set("Cookie", loginResponse.header["set-cookie"][0])
            .send({name: "updatedsamecustomer", surname: "updatedsamecustomer",address: "address", birthdate: "2000-01-01"}).expect(200)
            const user = await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(200)
            expect(user.body.name).toBe("updatedsamecustomer")
            expect(user.body.surname).toBe("updatedsamecustomer")
            expect(user.body.address).toBe("address")
            expect(user.body.birthdate).toBe("2000-01-01")
        })

        test("It should return a 404 error when username does not exist", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            await request(app).patch(`${routePath}/users/Invalid`).set("Cookie", loginResponse.header["set-cookie"][0])
            .send({name: "updatedcustomer", surname: "updatedcustomer",address: "address", birthdate: "2000-01-01"}).expect(404)

        })

        test("It should return a 401 error code if the user logged in not corrispond to the username", async () => {
            const custToRegister = { username: "custToRegister", name: "customer", surname: "customer", password: "customer", role: "Customer" }
            await request(app)
                .post(`${routePath}/users`) //The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
                .send(custToRegister) //In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
                .expect(200)
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: customer.username, password: customer.password})
            expect(loginResponse.status).toBe(200);
            await request(app).patch(`${routePath}/users/custToRegister`).set("Cookie", loginResponse.header["set-cookie"][0])
            .send({name: "updatedcustomer", surname: "updatedcustomer",address: "address", birthdate: "2000-01-01"}).expect(401)
        })
        
        test("It should return a 400 error when birthdate is after the current date", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            await request(app).patch(`${routePath}/users/customer`).set("Cookie", loginResponse.header["set-cookie"][0])
            .send({name: "updatedcustomer", surname: "updatedcustomer",address: "address", birthdate: "2025-01-01"}).expect(400)
        })

        test("It should return a 401 error is an Admin try to modify an other Admin", async () => {
            const admToRegister = { username: "admnew", name: "customer", surname: "customer", password: "customer", role: "Admin" }
            await request(app)
            .post(`${routePath}/users`) //The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
            .send(admToRegister) //In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
            .expect(200)

            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            await request(app).patch(`${routePath}/users/admnew`).set("Cookie", loginResponse.header["set-cookie"][0])
            .send({name: "updatedAdmin", surname: "updatedAdmin",address: "address", birthdate: "2000-01-01"}).expect(401)

        })

        test("It should return a 422 error if one of the body required fields is missing/wrong", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            await request(app).patch(`${routePath}/users/customer`).set("Cookie", loginResponse.header["set-cookie"][0])
            .send({name: "", surname: "updatedcustomer",address: "address", birthdate: "2000-01-01"}).expect(422)
            await request(app).patch(`${routePath}/users/customer`).set("Cookie", loginResponse.header["set-cookie"][0])
            .send({name: "updatedcustomer", surname: "",address: "address", birthdate: "2000-01-01"}).expect(422)
            await request(app).patch(`${routePath}/users/customer`).set("Cookie", loginResponse.header["set-cookie"][0])
            .send({name: "updatedcustomer", surname: "updatedcustomer",address: "", birthdate: "2000-01-01"}).expect(422)
            await request(app).patch(`${routePath}/users/customer`).set("Cookie", loginResponse.header["set-cookie"][0])
            .send({name: "updatedcustomer", surname: "updatedcustomer",address: "address", birthdate: ""}).expect(422)
        })
            
    })

    describe("POST /sessions", () => {
        test("It should return 401 if username or password is wrong", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: "wrongpassword"})
            expect(loginResponse.status).toBe(401);
        })
    })

    describe("DELETE /sessions/current", () => {
        test("It should return 200 if session is deleted", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            const deleteResponse = await request(app)
            .delete(routePath + "/sessions/current")
            .set("Cookie", loginResponse.header["set-cookie"][0])
            expect(deleteResponse.status).toBe(200);
        })

        test("It should return 401 if session is not deleted", async () => {
            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);

            const deleteResponse = await request(app)
            .delete(routePath + "/sessions/current")
            .set("Cookie", loginResponse.header["set-cookie"][0])
            expect(deleteResponse.status).toBe(200);

            await request(app)
            .delete(routePath + "/sessions/current")
            .set("Cookie", loginResponse.header["set-cookie"][0])
            expect(deleteResponse.status).toBe(200);
        })
    })
})

describe("User tests - DAO + db", () => {
    describe('createUser', () => {
        
        test("It should return true and add the user to the database", async () => {
            const admToRegister = { username: "admnewcx", name: "customer", surname: "customer", password: "customer", role: "Admin" }
            const userDAO = new UserDAO()
            const res= await userDAO.createUser(admToRegister.username, admToRegister.name, admToRegister.surname, admToRegister.password, admToRegister.role)
            expect(res).toBe(true);
    
            const loginResponse = await request(app)
                .post(routePath + "/sessions")
                .send({username: admin.username, password: admin.password})
                expect(loginResponse.status).toBe(200);
                
                //A possible way is retrieving all users and looking for the user we just created.
            const users = await request(app) //It is possible to assign the response to a variable and use it later. 
                .get(`${routePath}/users`)
                .set("Cookie", loginResponse.header["set-cookie"][0]) //Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
                expect(users.status).toBe(200)
                expect(users.body).toHaveLength(6) //6 users abbiamo creato con questo
            
        })    
    
        test("It should return UserAlreadyExists error", async () => {
            const admToRegister = { username: "admnewcx", name: "customer", surname: "customer", password: "customer", role: "Admin" }
            const userDAO = new UserDAO()
            await expect(userDAO.createUser(admToRegister.username, admToRegister.name, admToRegister.surname, admToRegister.password, admToRegister.role)).rejects.toThrow(UserAlreadyExistsError);
    
            const loginResponse = await request(app)
                .post(routePath + "/sessions")
                .send({username: admin.username, password: admin.password})
                expect(loginResponse.status).toBe(200);
                
                //A possible way is retrieving all users and looking for the user we just created.
            const users = await request(app) //It is possible to assign the response to a variable and use it later. 
                .get(`${routePath}/users`)
                .set("Cookie", loginResponse.header["set-cookie"][0]) //Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
                expect(users.status).toBe(200)
                expect(users.body).toHaveLength(6) //6 users abbiamo creato con questo
            
        })    


    })
    
    describe('getUserByUsername', () => {
        test("It should return the user", async () => {
            const newCustomer = { username: customer.username, name: "updatedsamecustomer", surname: "updatedsamecustomer", role: "Customer",address: "address", birthdate: "2000-01-01" }
            const userDAO = new UserDAO();
            await expect(userDAO.getUserByUsername(customer.username)).resolves.toEqual(new User(newCustomer.username, newCustomer.name, newCustomer.surname, Role.CUSTOMER, newCustomer.address, newCustomer.birthdate));
        })

        test("It should return UserNotFoundError", async () => {
            const userDAO = new UserDAO();
            await expect(userDAO.getUserByUsername("wrongusername")).rejects.toThrow(UserNotFoundError);
        })

    })

    describe('getAllUsers', () => {
        test("It should return all users", async () => {

            const loginResponse = await request(app)
            .post(routePath + "/sessions")
            .send({username: admin.username, password: admin.password})
            expect(loginResponse.status).toBe(200);
            await request(app).delete(`${routePath}/users`).set("Cookie", loginResponse.header["set-cookie"][0]).expect(200)
            const users = await request(app)
            .get(`${routePath}/users`)
            .set("Cookie", loginResponse.header["set-cookie"][0])
            expect(users.status).toBe(200)
            const admToRegister = { username: "admToRegister", name: "customer", surname: "customer", password: "customer", role: "Admin" }
            const userDAO = new UserDAO();
            const reg  = [{"address": "", "birthdate": "", "name": "admin", "role": "Admin", "surname": "admin", "username": "admin"}, {"address": "", "birthdate": "", "name": "customer", "role": "Admin", "surname": "customer", "username": "admToRegister"}, {"address": "", "birthdate": "", "name": "customer", "role": "Admin", "surname": "customer", "username": "admnew"}, {"address": "", "birthdate": "", "name": "customer", "role": "Admin", "surname": "customer", "username": "admnewcx"}]
            const usersReg = [new User(reg[0].username, reg[0].name, reg[0].surname, Role.ADMIN, "", ""), new User(reg[1].username, reg[1].name, reg[1].surname, Role.ADMIN, "", ""), new User(reg[2].username, reg[2].name, reg[2].surname, Role.ADMIN, "", ""), new User(reg[3].username, reg[3].name, reg[3].surname, Role.ADMIN, "", "")]
            await expect(userDAO.getUsers()).resolves.toEqual(usersReg);
        })
    })

    describe('getUsersByRole', () => {
        test("It should return all users with the specified role", async () => {

            const userDAO = new UserDAO();
            const reg  = [{"address": "", "birthdate": "", "name": "admin", "role": "Admin", "surname": "admin", "username": "admin"}, {"address": "", "birthdate": "", "name": "customer", "role": "Admin", "surname": "customer", "username": "admToRegister"}, {"address": "", "birthdate": "", "name": "customer", "role": "Admin", "surname": "customer", "username": "admnew"}, {"address": "", "birthdate": "", "name": "customer", "role": "Admin", "surname": "customer", "username": "admnewcx"}]
            const usersReg = [new User(reg[0].username, reg[0].name, reg[0].surname, Role.ADMIN, "", ""), new User(reg[1].username, reg[1].name, reg[1].surname, Role.ADMIN, "", ""), new User(reg[2].username, reg[2].name, reg[2].surname, Role.ADMIN, "", ""), new User(reg[3].username, reg[3].name, reg[3].surname, Role.ADMIN, "", "")]
            await expect(userDAO.getUsersByRole(Role.ADMIN)).resolves.toEqual(usersReg);
        })

        test("It should return an empty array if role is not valid", async () => {

            const userDAO = new UserDAO();
            await expect(userDAO.getUsersByRole("Invalid")).resolves.toEqual([]);
        })
    })

    describe('deleteUser', () => {
        test("It should delete a user", async () => {

            const userDAO = new UserDAO();
            const admToRegister = { username: "elcustomer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
            const newAdm = new User(admToRegister.username, admToRegister.name, admToRegister.surname, Role.CUSTOMER, "", "")
            await expect(userDAO.createUser(admToRegister.username, admToRegister.name, admToRegister.surname, admToRegister.password, admToRegister.role)).resolves.toEqual(true);
            await expect(userDAO.deleteUser(new User(admToRegister.username, admToRegister.name, admToRegister.surname, Role.CUSTOMER, "", ""), admToRegister.username)).resolves.toEqual(true);
        })

        //controllo effettuato nel controller
        /*test("It should return UserNotFoundError", async () => {
            const userDAO = new UserDAO();
            await expect(userDAO.deleteUser(new User("wrongusername", "customer", "customer", Role.CUSTOMER, "", ""), "wrongusername")).rejects.toThrow(UserNotFoundError);
        })
        */
    })

    describe('updateUser', () => {
        test("It should update a user", async () => {

            const userDAO = new UserDAO();
            const admToRegister = { username: "elcustomer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
            const newAdm = new User(admToRegister.username, admToRegister.name, admToRegister.surname, Role.CUSTOMER, "", "")
            await expect(userDAO.createUser(admToRegister.username, admToRegister.name, admToRegister.surname, admToRegister.password, admToRegister.role)).resolves.toEqual(true);
            await expect(userDAO.updateUserInfo(newAdm, "elcustomermod", "customermod", "customermod", "2000-01-01", "elcustomer")).resolves.toEqual(new User(admToRegister.username, "elcustomermod", "customermod", Role.CUSTOMER, "customermod","2000-01-01"));
        })

        test("It should return UnauthorizedError", async () => {

            const userDAO = new UserDAO();
            const admToRegister = { username: "elcustomer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
            const newAdm = new User(admToRegister.username, admToRegister.name, admToRegister.surname, Role.CUSTOMER, "", "")
            await expect(userDAO.updateUserInfo(newAdm, "elcustomermod", "customermod", "customermod", "2000-01-01", "DifferentUser")).rejects.toThrow(Error);
        })
    })

    describe('deleteAllUsers', () => {
        test("It should delete all users", async () => {

            const userDAO = new UserDAO();
            await expect(userDAO.deleteAll()).resolves.toEqual(true);
            const reg  = [{"address": "", "birthdate": "", "name": "admin", "role": "Admin", "surname": "admin", "username": "admin"}, {"address": "", "birthdate": "", "name": "customer", "role": "Admin", "surname": "customer", "username": "admToRegister"}, {"address": "", "birthdate": "", "name": "customer", "role": "Admin", "surname": "customer", "username": "admnew"}, {"address": "", "birthdate": "", "name": "customer", "role": "Admin", "surname": "customer", "username": "admnewcx"}]
            const usersReg = [new User(reg[0].username, reg[0].name, reg[0].surname, Role.ADMIN, "", ""), new User(reg[1].username, reg[1].name, reg[1].surname, Role.ADMIN, "", ""), new User(reg[2].username, reg[2].name, reg[2].surname, Role.ADMIN, "", ""), new User(reg[3].username, reg[3].name, reg[3].surname, Role.ADMIN, "", "")]
            await expect(userDAO.getUsers()).resolves.toEqual(usersReg);
        })
    })


})
