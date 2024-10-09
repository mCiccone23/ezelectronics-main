# Graphical User Interface Prototype - FUTURE

Authors:

Date:

Version:

\<Report here the GUI that you propose for EZElectronics in FUTURE form, as proposed by the team. You are free to organize it as you prefer. A suggested presentation matches the Use cases and scenarios defined in the Requirement document. The GUI can be shown as a sequence of graphical files (jpg, png) >

## Autenticazione
### Pagina iniziale
Rappresenta la prima interfaccia con cui l'utente si relaziona

![Benvenuto Web](./GUImg/V2/pagina_di_benvenuto_web.png)

![Benvenuto](./GUImg/V2/pagina_di_benvenuto.png)

### Login di un utente
Per un Manager/Admin già registrato, l'interfaccia di login è la seguente
![Login Web](./GUImg/V2/login_web.png)

Interfaccia di un Customer che utilizza un dispositivo mobile:
![Login](./GUImg/V2/login.png)

All'interno di queste pagine è presente il link che porta alla sezioen di recupero password.

### Recupera password
Se un Customer dimentica la password per accedere al suo account può utilizzare questa sezione del sito

![Recupero password](./GUImg/V2/recupero_password.png)

Step successivo: inserire nuova password

![Reset password](./GUImg/V2/reset_password.png)


### Registrazione nuovo utente Customer
Per un Customer che vuole effettuare la registrazione tramite dispositivo mobile, l'interfaccia è la seguente

![Registrazione](./GUImg/V2/registrazione.png)

L'interfaccia di un Admin che vuole creare un nuovo account Manager

![Registrazione Manager](./GUImg/V2/registrazione_web.png)

### Visualizzazione Profilo
Interfaccia di un Customer che vuole visualizzare i dati del suo account. All'interno di questa schermata è anche presente l'opzione di logout e di eliminare il proprio account

![Visualizzazione Customer](./GUImg/V2/mostra_utente.png)

Interfaccia di un Manager che vuole visualizzare i dati del suo account. All'interno di questa schermata è anche presente l'opzione di logout e di eliminare il proprio account

![Visualizzazione Manager](./GUImg/V2/mostra_utente_web.png)

### Modificare dati del proprio account
Interfaccia di un Customer che vuole modificare i dati del suo account

![Modifica dati Customer](./GUImg/V2/modifica_dati_user.png)

Interfaccia di un Manager che vuole modificare i dati del suo account

![Modifica dati Manager](./GUImg/V2/modifica_dati_user_web.png)

## Gestione Utenti

### Visualizzazione Utenti
L'Admin può visualizzazre la lista di tutti gli utenti tramite apposita interfaccia

![Visualizzazione Utenti](./GUImg/V2/admin_visualizzazione_utenti.png)

### Elimina un utente
L'Admin può eliminare un utnete dalla lista di tutti gli utenti tramite apposita interfaccia

![Elimina Utente](./GUImg/V2/elimina_user_web.png)

## Gestione prodotti
### Mostra lista completa prodotti, per codice, categoria, modello

In questa schermata vengono mostrati i prodotti con un menu laterale con varie opzioni di ricerca e un menu in basso per ordinare i risultati.
Questa è la versione browser del manager con la possibilità di registrare nuovi prodotti e gestire i singoli prodotti, la versione customer invece consente di aggiungere i prodotti al carrello. 

![Mostra prodotti manager 1](./GUImg/V2/prodotti_modello_manager.png)

Filtrando per categoria anziché modello, la textbox per inserire il modello viene sostituita da una combobox con le varie categorie. 

![Mostra prodotti manager 2](./GUImg/V2/prodotti_categoria_manager.png)
Nella versione mobile del customer è possibile filtrare e ordinare i prodotti cliccando sulla lente di ingrandimento in alto.<br>
![Mostra prodotti mobile 1](./GUImg/V2/mostra_prodotti_mobile.png)

![Mostra prodotti mobile 2](./GUImg/V2/prodotti_modello_mobile.png)

![Mostra prodotti mobile 3](./GUImg/V2/prodotti_categoria_mobile.png)

### Dettaglio prodotto

Cliccando sui singoli prodotti sia nella versione browser che mobile oppure sull'opzione "Dettagli" nella versione browser del manager è possibile visualizzare un dettaglio del singolo prodotto. 
Il manager ha la possibilità di gestire i singoli prodotti o modificare i dati del modello, il customer ha la possibilità di aggiungerlo al carrello (bottone verde), aggiungerlo alla lista dei desideri (bottone rosso) o scriverne una rensione (bottone blu).

![Dettaglio prodotto manager](./GUImg/V2/dettaglio_prodotto_manager.png)

![Dettaglio prodotto mobile](./GUImg/V2/dettaglio_prodotto_mobile.png)

### Registrare nuovi prodotti

Nella versione browser del manager sono disponibili le funzionalità "Registra nuovi arrivi" e "Registra nuovo modello", cliccare sui relativi bottoni nell'interfaccia dei prodotti aprirà un form per l'inserimento.

![Registrare nuovo modello](./GUImg/V2/nuovo_prodotto.png)

![Registrare nuovi arrivi](./GUImg/V2/nuovi_arrivi.png)

### Gestione prodotti

Nella versione browser del manager sono disponibili le funzionalità "Gestisci singoli prodotti" e "Modifica modello". In  "Gestisci singoli prodotti" è possibile modificare la data di arrivo del prodotto digitandola sulla tabella e cliccando sul bottone "Modifica". Ed è anche possibile segnare un prodotto come venduto digitando la data di vendita sulla tabella oppure lasciandola vuota se si vuole utilizzare quella corrente e poi cliccare sul bottone "Contrassegna come venduto".

![Gestisci singoli prodotti](./GUImg/V2/gestisci_singoli_prodotti.png)

![Modifica modello](./GUImg/V2/modifica_modello.png)

## Recensioni

Nella versione customer è possibile scrivere una recensione di un prodotto.
Nella visualizzazione dei prodotti è mostrato il punteggio medio del prodotto.

![Scrivi recensione](./GUImg/V2/aggiungi_recensione.png)

## Gestione carrello
### Mostra carrello, effettua checkout ordine, rimuovi prodotto dal carrello ed elimina carrello

In questa schermata viene mostrato il carrello di un utente.

![Mostra carrello effetua checkout rimuovi prodotto ed elimina carrello](./GUImg/V2/Mostra_Carrello.png)

E' inoltre possibile effettuare il checkout del carrello (cliccando sul bottone "Procedi all'ordine"), rimuovere un prodotto dal carrello (cliccando sul bottone "rimuovi prodotto") oppure svuotare il carrello andando ad eliminare tutti i prodotti (cliccando sul tasto in alto "elimina intero carrello").

## Aggiungi prodotto al carrello
In questa schermata, cliccando sul bottone verde "Aggiungi al Carrello", il prodotto selezionato viene aggiunto al carrello.

![Aggiungi prodotto](./GUImg/V2/Aggiungi_Prodotto.png)

E' quindi possibile ora visualizzare il prodotto all'interno del carrello.

## Mostra Ordini
In questa schermata è possibile visualizzare tutti gli ordini effettuati.

![Mostra ordini](./GUImg/V2/Mostra_Ordini.png)

## Pagamento carrello
Una volta premuto il tasto "Procedi all'Ordine" si aprirà un pop-up per inserire tutti i dati della carta di credito con la quale si desidera effettuare il pagamento

![Effettua pagamento](./GUImg/V2/Pagamento_Carrello.png)

Cliccando su "Acquista ora" si completerà il pagamento

## Scadenza carrello
Se non è stata effettuata nessun'operazione sul carrello per un tot di tempo, quando si aprirà il carrello verrà mostrato un banner che avvertirà il customer che se non effettuerà alcun'operazione entro una data x, il carrello verrà automaticamente svuotato (Verranno rimossi tutti i prodotti al suo interno)

![Scadenza carrello](./GUImg/V2/Scadenza_Carrello.png)