![][image1]

**Blinto Talent Accelerator 2027**

**Full Stalk Developer Internship**  
Assessment

### **Doomsday Ready — Full-Stack Application**

Build Doomsday Ready, a small full-stack app that helps MCU fans plan their rewatch before Avengers: Doomsday and book an opening-night watch party.

# **1\. Background**

Avengers: Doomsday is coming, and fans want to catch up first. Many MCU movies build on earlier ones, so fans need to know what to rewatch and in what order.

They also want to see the premiere together, but cinemas sell opening-night seats only in group bundles.

## **Rules**

* The work must be your own.  
* AI tools are allowed, but say how you used them in your README.  
* Write the logic of features 1 and 2 yourself, without libraries that solve them.  
* If something is unclear, make a reasonable choice and note it in your README.

# **2\. What to Build**

## **Feature 1: Movies and Rewatch Order**

**Create a movie with:**

* Title: unique  
* Release year and runtime in minutes: 1–300  
* Prerequisites: movies you should watch first (optional; can be changed later)  
* Watched: true or false (default false; can be updated)

###  **Validation**

A movie can never depend on itself, either directly or through other movies.  
Reject any create or update that would cause this with **`409 CIRCULAR_DEPENDENCY`**.

###  **Rewatch Order**

Given a target movie, return every movie you need to see before it (its prerequisites, their prerequisites, and so on), each exactly once, in an order where every movie comes after its prerequisites.

Do not include the target itself.

Also return how many of those movies are watched and the total runtime of the unwatched ones.

###  **Example Data**

These links are sample data for this challenge, not an official watch guide.

| Movie | Watch These First |
| :---- | :---- |
| Iron Man | None |
| Captain America: The First Avenger | None |
| The Avengers | Iron Man, The First Avenger |
| Captain America: Civil War | The Avengers |
| Thor: Ragnarok | None |
| Avengers: Infinity War | Civil War, Ragnarok |
| Avengers: Endgame | Infinity War |
| Avengers: Doomsday | Endgame |

###  **Expected Results** 

| Request | Expected Result |
| ----- | ----- |
| Rewatch order for Avengers: Doomsday | All 7 other movies in any valid order, such as Iron Man, The First Avenger, The Avengers, Civil War, Ragnarok, Infinity War, Endgame |
| Rewatch order for Captain America: Civil War | Iron Man and The First Avenger (in either order), then The Avengers |
| Rewatch order for Thor: Ragnarok | An empty list |
| Make Avengers: Endgame a prerequisite of Iron Man | `409 CIRCULAR_DEPENDENCY` |

## **Feature 2: Cinemas and Watch-Party Booking**

**Create a cinema with:**

* Name: unique  
* Bundle sizes: the seat bundles the cinema sells for opening night.

For example, sizes 2 and 5 mean seats are sold only in bundles of 2 or 5, and you can buy as many of each as you need.

A cinema has between 1 and 10 different bundle sizes, and each bundle holds 1 to 500 seats.

###  **Booking Quote**

Given a cinema and a group size (1–10,000), return the fewest bundles whose seats add up to exactly the group size, so nobody pays for an empty seat, and how many of each size to buy.

If no exact combination exists, say so.

### **Expected Results** 

| Bundle Sizes | Group Size | Expected Result |
| :---- | :---- | :---- |
| 1, 3, 4 | 6 | 2 bundles: 3 × 2 |
| 2, 5 | 11 | 4 bundles: 5 × 1, 2 × 3 |
| 6, 9, 20 | 44 | 4 bundles: 20 × 1, 9 × 2, 6 × 1 |
| 4, 6 | 7 | Not possible |

## **Feature 3: Frontend** 

**Build a simple React app that uses your API and has three views:**

### **1\. Movies**

Add movies, edit their prerequisites, and tick them as watched.

### **2\. Rewatch Plan**

Pick a target movie and see the ordered list with watched ticks, a progress bar (for example "4 of 7 watched") and the remaining watch time.

### **3\. Booking**

Pick a cinema, enter a group size, and see the bundles to buy or "not possible".

#  **3\. API Reference**

**Use these endpoints under `/api`. You may add more.**

| Method and Path | Purpose |
| ----- | ----- |
| `POST /movies` | Create movies |
| `GET /movies` | List movies |
| `PATCH /movies/:id` | Update a movie, including watched and prerequisites |
| `GET /movies/:id/rewatch-order` | Rewatch order (feature 1\) |
| `POST /cinemas` | Create cinemas |
| `GET /cinemas` | List cinemas |
| `GET /cinemas/:id/booking?groupSize=6` | Booking quote (feature 2\) |

#   **Submission**

* **Share a Git repository link by submitting the google form that delivered this challenge.**

# **Bonus**

* **A data model diagram in the README showing how movies and cinemas are structured.**  
* **Docker Compose to start everything with one command.**

##  

[image1]: <data:image/png;base64,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>