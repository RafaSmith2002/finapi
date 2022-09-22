const express = require("express");
const app = express();
//importando a biblioteca UUID e renomeando para uuidv4.
const { v4: uuidv4 } = require("uuid");
//importando middleware de uso do json.
app.use(express.json());

//criamos uma array onde serão armazenados os dados em tempo de execução.
const customers = [];

//middleware de verificação de constas.
function verifyIfExistsAccountCPF (request, response, next) {
    const { cpf } = request.headers;
    const customer = customers.find((customer) => customer.cpf == cpf);
    if(!customer){
        return response.status(400).json({error: "Customer not found!"});
    }

    request.customer = customer;
    return next();
}

//calculando o balanço da conta.
function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount;
        }else {
            return acc - operation.amount;
        }
    }, 0);
    return balance;
}


/*
* Dados da conta
* cpf - string
* nome - string
* id - uuid - biblioteca de indentificador universal
* statement - [] aqui vai mostrar o extrato do cliente
*/

//como sabemos o post é o metodo para criar, usaremos /account como o recurso.
app.post("/account", (request, response) => {
    const { cpf, name } = request.body; //pegando o cpf e nome utilizando desestruturação.
    const customersAlreadyExists = customers.some(  //Não deve ser possivel cadastrar uma conta com o mesmo cpf.
        (customer) => customer.cpf === cpf
    );
//regra caso o cpf já esteja cadastrado.
    if (customersAlreadyExists){
        return response.status(400).json({error: "Customer already exists!"});
    }

    //const id = uuidv4(); essa eh uma das formas de usar o uuidv4.
    
    customers.push({
        cpf,
        name,
        id: uuidv4(), //essa eh outra forma de usar o uuidv4.
        statement: []
    });

    return response.status(201).send();
});

//usamos o metodo get para buscar, usaremos /statement como recurso.
//app.get("/statement/", (request, response) => {
app.get("/statement/", verifyIfExistsAccountCPF, (request, response) => { //- url com o cpf no statement.
//app.get("/statement/:cpf", (request, response) => {
    const { customer } = request // nao sera usado por enquanto.
    //const { cpf } = request.header;
    //const { cpf } = request.params; //- nao sera mais usado por enquanto.
    //const customer = customers.find((customer) => customer.cpf == cpf);
    return response.json(customer.statement);
});


//fazendo deposito na conta
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    };

    customer.statement.push(statementOperation);
    return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);
    if(balance < amount) {
        return response.status(400).json({error: "insufficient funds!"})
    };

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    costumer.statement.push(statementOperation);
    return response.status(201).send(); 

})


//buscar extrato por data
app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;
    //formatando a data e informando ao filtro que o horário não é relevante.
    const dateFormat = new Date(date + " 00:00");

    //filtro para retornar o extrato somente da data informada.
    const statement = customer.statement.filter((statement) => 
    statement.created_at.toDateString() ===
    new Date (dateFormat).toDateString()
    );

    // caso exista alguma movimentação neste dia, retorne o extrato
    return response.json(statement)


})

//atualizar dados do cliente
app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;
    return response.status(201).send();
    

});

//obter dados da conta
app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer);
});

//deletar conta
app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    
    customers.splice(customer, 1);

    return response.status(200).json(customers);

})


//retornando o balanço da contains
app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const balance = getBalance(customer.statement);

    return response.json(balance);
});


//realiza saque?? verificar problema com danilo

app.listen (3333);