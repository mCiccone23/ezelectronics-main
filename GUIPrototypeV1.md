# Graphical User Interface Prototype - CURRENT

Authors: 

Date:

Version:

\<Report here the GUI that you propose for EZElectronics in CURRENT form, as received by teachers. You are free to organize it as you prefer. A suggested presentation matches the Use cases and scenarios defined in the Requirement document. The GUI can be shown as a sequence of graphical files (jpg, png) >

## Autenticazione
### Pagina iniziale
Rappresenta la prima interfaccia con cui l'utente si relaziona

![Benvenuto Web](./GUImg/V1/pagina_di_benvenuto_web.png)

![Benvenuto](./GUImg/V1/pagina_di_benvenuto.png)

### Login di un utente
Per un Manager/Customer già registrato, l'interfaccia di login è la seguente
![Login Web](./GUImg/V1/login_web.png)

Interfaccia di un Customer che utilizza un dispositivo mobile:
![Login](./GUImg/V1/login.png)

### Registrazione nuovo utente
Per un Manager/Customer che vuole effettuare la registrazioen tramite web, l'interfaccia è la seguente
![Registrazione Web](./GUImg/V1/registrazione_web.png)

Interfaccia di un Customer che vuole registrarsi tramite dispositivo mobile:
![Registrazione](./GUImg/V1/registrazione.png)


## Gestione Account
### Mostra Profilo


<div style="text-align:center;">
    <img src="./GUImg/V1/mostra_profilo.png" alt="Testo alternativo" style="width:50%; display:block; margin:auto;" />
</div>

La schermata mostra tutte le informazioni relative all'utente attualmente loggato e offre la possibilità di effetture il logout

![Mostra Profilo Web](./GUImg/V1/mostra_profilo_web.png)

## Gestione Utenti
![Mostra Profilo Web](./GUImg/V1/users_view.png)

In questa schermata è possibile visualizzare la lista di tutti gli utenti, di effettuare una ricerca inserendo l'username nella parte destra e di filtrare per ruolo selezionando la rispettiva casella.

### Elimina Utente
Cliccando bottone elimina account viene attivata la seguente schermata

![Mostra Profilo Web](./GUImg/V1/elimina_utente.png)

Cliccando su yes l'utente della riga relativa al bottone premuto verrà eliminato definitivamente

### Crea utente
Cliccando sul bottone blu "crea nuovo utente" verrà attivata la seguente schermata.

![Mostra Profilo Web](./GUImg/V1/crea_utente.png)

Inserendo i dati e cliccando su "crea nuovo utente" verrà aggiunto un nuovo utente al sistema.

## Gestione prodotti
### Mostra lista completa prodotti, per codice, categoria, modello

In questa schermata vengono mostrati i prodotti con un menu laterale con varie opzioni di ricerca.
Questa è la versione browser del manager con la possibilità di registrare nuovi prodotti e gestire i singoli prodotti, la versione customer invece consente di aggiungere i prodotti al carrello. 

![Mostra prodotti manager 1](./GUImg/V1/prodotti_modello_manager.png)

Filtrando per categoria anziché modello, la textbox per inserire il modello viene sostituita da una combobox con le varie categorie. 

![Mostra prodotti manager 2](./GUImg/V1/prodotti_categoria_manager.png)
Nella versione mobile del customer è possibile filtrare i prodotti cliccando sulla lente di ingrandimento in alto.<br>
![Mostra prodotti mobile 1](./GUImg/V1/aggiungi_prodotto_al_carrello.png)

![Mostra prodotti mobile 2](./GUImg/V1/prodotti_modello_mobile.png)

![Mostra prodotti mobile 3](./GUImg/V1/prodotti_categoria_mobile.png)

### Dettaglio prodotto

Cliccando sui singoli prodotti sia nella versione browser che mobile oppure sull'opzione "Gestisci" nella versione browser del manager è possibile visualizzare un dettaglio del singolo prodotto. 
Il manager ha la possibilità di segnare il prodotto come venduto o cancellarlo, il customer ha la possibilità di aggiungerlo al carrello.

![Dettaglio prodotto manager](./GUImg/V1/dettaglio_prodotto_manager.png)

![Dettaglio prodotto mobile](./GUImg/V1/dettaglio_prodotto_mobile.png)

### Registrare nuovi prodotti

Nella versione browser del manager sono disponibili le funzionalità "Registra nuovi arrivi" e "Registra nuovo prodotto, cliccare sui relativi bottoni nell'interfaccia dei prodotti aprirà un form per l'inserimento.

![Registrare nuovi arrivi](./GUImg/V1/nuovi_arrivi.png)

![Registare nuovo prodotto](./GUImg/V1/nuovo_prodotto.png)

## Gestione carrello
### Mostra carrello, effettua checkout ordine, rimuovi prodotto dal carrello ed elimina carrello

In questa schermata viene mostrato il carrello di un utente.

![Mostra carrello effetua checkout rimuovi prodotto ed elimina carrello](./GUImg/V1/mostra_carrello.png)

 E' inoltre possibile effettuare il checkout del carrello (cliccando sul bottone "Procedi all'ordine"), rimuovere un prodotto dal carrello (cliccando sul bottone "rimuovi prodotto") oppure svuotare il carrello andando ad eliminare tutti i prodotti (cliccando sul tasto in alto "elimina intero carrello").

## Aggiungi prodotto al carrello
In questa schermata, cliccando sul bottone verde "Aggiungi al Carrello", il prodotto selezionato viene aggiunto al carrello.

![Aggiungi prodotto](./GUImg/V1/aggiungi_prodotto_al_carrello.png)

E' quindi possibile ora visualizzare il prodotto all'interno del carrello.

## Mostra Ordini
In questa schermata è possibile visualizzare tutti gli ordini effettuati.

![Mostra ordini](./GUImg/V1/mostra_ordini.png)