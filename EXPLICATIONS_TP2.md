# TP2 NestJS — Parties 1 et 2 : explications

Branche : `tp2-parties-1-2` (créée depuis `main`, la version validée du TP1).

- **Partie 1** : un middleware simule l'authentification sur le contrôleur Todo. Chaque todo a un créateur, et seul ce créateur peut le modifier ou le supprimer.
- **Partie 2** : un petit gestionnaire de CV (User, Cv, Skill) avec un CRUD générique partagé.

---

## 1. Lancer et tester

```bash
npm install
cp .env.example .env        # puis mettre un vrai secret dans JWT_SECRET
npm run start:dev           # http://localhost:3000
npm run tokens              # génère les tokens de test (à coller dans requests.http)
```

Les tests sont dans **`requests.http`** (extension *REST Client* de VS Code, bouton « Send Request »). Les ids des requêtes (1, 2, 3…) supposent une base neuve : supprimer `todo.sqlite` puis relancer l'app.

Résultats obtenus sur une base neuve (56 requêtes) : 18 × 200, 11 × 201, 6 × 400, 4 × 401, 4 × 403, 13 × 404, chaque fois le code attendu. Le mot `password` n'apparaît dans aucune réponse, sauf dans le *nom du champ* du message d'erreur de validation.

### Historique des commits

| Commit | Étape |
|---|---|
| `refactor(todos)` | Extraction de la logique Todo dans `TodosService` et `TodosModule` (routes et réponses inchangées) |
| `feat(auth)` | `AuthMiddleware`, `AuthRequest`, `ConfigModule`, `.env.example` |
| `feat(todos)` | Colonne `userId`, vérification du créateur (404 / 403) |
| `test(auth)` | Script `npm run tokens`, partie 1 de `requests.http` |
| `refactor(common)` | Déplacement de `TimestampEntity` dans `src/common/entities/` |
| `feat(common)` | `CrudService<T>` générique |
| `feat(user)`, `feat(skill)`, `feat(cv)` | Une ressource par commit (générées avec `nest g resource`) |
| `test(cv)` | Partie 2 de `requests.http` |

---

## 2. Rôle de chaque fichier

### Fichiers communs (`src/common/`)

| Fichier | Rôle |
|---|---|
| `middlewares/auth.middleware.ts` | Lit le header `auth-user`, vérifie le JWT avec `verify`, met `userId` dans la requête, ou répond 401 avec `res.json` |
| `interfaces/auth-request.interface.ts` | `AuthRequest extends Request` + `userId: number` : type de la requête une fois enrichie par le middleware |
| `entities/timestamp.entity.ts` | Classe de base du TP1 (`createdAt`, `updatedAt`, `deletedAt`), déplacée ici car partagée par Todo, User, Cv et Skill |
| `services/crud.service.ts` | `CrudService<T>` abstrait et générique : `findAll`, `findOne` (404), `create`, `update` (404), `remove` |

### Todo (`src/todos/`)

| Fichier | Rôle |
|---|---|
| `todos.module.ts` | Nouveau. `TypeOrmModule.forFeature([TodoEntity])`, déclare le controller et le service |
| `todos.service.ts` | Nouveau. Toute la logique qui était dans le controller (avec `DataSource`) passe par `Repository<TodoEntity>`. Ajoute `checkOwnership` (404 puis 403) |
| `todos.controller.ts` | Ne fait plus que recevoir la requête et déléguer. Récupère `req.userId` avec `@Req()` |
| `entities/todo.entity.ts` | Ajout de la colonne `userId` (nullable) |

### Gestionnaire de CV

| Fichier | Rôle |
|---|---|
| `user/entities/user.entity.ts` | `id`, `username`, `email`, `password` (`select: false`), `@OneToMany cvs` |
| `skill/entities/skill.entity.ts` | `id`, `designation` |
| `cv/entities/cv.entity.ts` | `id`, `name`, `firstname`, `age`, `cin`, `job`, `path` (nullable), `@ManyToOne user`, `@ManyToMany skills` + `@JoinTable` |
| `*/dto/create-*.dto.ts` | Validation avec `class-validator` |
| `*/dto/update-*.dto.ts` | `PartialType(Create…Dto)` : mêmes règles, tous les champs optionnels |
| `user/user.service.ts`, `skill/skill.service.ts` | `extends CrudService<User / Skill>`. Le CRUD est entièrement hérité. `SkillService` ajoute `findByIds` |
| `cv/cv.service.ts` | `extends CrudService<Cv>`. Redéfinit `create` et `update` pour transformer `userId` et `skillIds` en entités |
| `*/…module.ts` | `forFeature([Entité])`. `UserModule` et `SkillModule` **exportent** leur service, que `CvModule` importe |
| `*/…controller.ts` | Routes REST générées, avec `ParseIntPipe` sur `:id` |

### Autres fichiers

| Fichier | Rôle |
|---|---|
| `app.module.ts` | `ConfigModule.forRoot`, liste des entités, `implements NestModule` → `configure()` applique le middleware |
| `scripts/generate-tokens.mjs` | Signe 4 JWT de test : user 1, user 2, sans `userId`, mauvais secret |
| `.env.example` | Modèle du `.env` (le vrai `.env` est ignoré par git) |
| `requests.http` | Tous les tests manuels |

---

## 3. Partie 1 — Concepts et choix

### 3.1 Le refactor préalable : `TodosService`

Dans le TP1, le controller utilisait `DataSource` directement. J'ai déplacé la logique dans un service, selon la méthode du cours :

- `TypeOrmModule.forFeature([TodoEntity])` dans `TodosModule` enregistre un provider `Repository<TodoEntity>` dans ce module.
- `@InjectRepository(TodoEntity)` l'injecte dans le constructeur du service.

**Pourquoi ?** Le controller gère le HTTP (routes, paramètres, format de la réponse) et le service gère la logique métier et l'accès aux données. C'est la séparation des responsabilités. Le service devient réutilisable et testable, et le controller est plus lisible.

**Vérification :** avant le refactor, j'ai enregistré les réponses de 22 requêtes. Après le refactor, elles sont identiques (codes HTTP et corps).

### 3.2 Le middleware

Un middleware est une fonction exécutée **avant** le route handler, avec accès à `req`, `res` et `next`. Dans Nest, on l'écrit comme une **classe** `@Injectable()` qui `implements NestMiddleware` et a une méthode `use(req, res, next)`. Comme c'est un provider, on peut lui injecter des dépendances : ici `ConfigService`, pour lire le secret.

Ce que fait `AuthMiddleware.use()` :

1. Il lit `req.headers['auth-user']`. Si ce n'est pas une `string` (header absent, donc `undefined`, ou répété, donc `string[]`), il refuse.
2. Il appelle `extractUserId(token)`, qui fait `verify(token, secret)` dans un `try/catch`. Il renvoie `null` si le token est invalide, expiré, ou si son payload n'a pas de `userId` numérique.
3. S'il refuse : `res.status(401).json({...})` et **pas de `next()`**. La requête s'arrête là et n'atteint jamais le controller.
4. Sinon : `(req as AuthRequest).userId = userId` puis `next()`.

`next()` est appelé **en dehors** du `try/catch`. Une erreur levée plus loin (dans le controller) ne peut donc pas être prise par erreur pour un token invalide.

### 3.3 `NestModule`, `configure()`, `forRoutes()`

Un middleware ne se déclare pas dans `@Module({...})`. Le module implémente `NestModule` :

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(TodosController);
  }
}
```

`forRoutes` accepte une chaîne (`'todos'`), un objet `{ path, method }`, ou une **classe de controller** (toutes ses routes). On peut aussi retirer des routes avec `.exclude(...)`.

**Choix : tout `TodosController`.** L'énoncé parle « d'accès au contrôleur Todo pour la partie persistance », et `TodosController` est justement le contrôleur de persistance. Passer la classe protège automatiquement toute route ajoutée plus tard, alors qu'une liste de chemins écrite à la main est fragile. Nest l'applique aussi aux routes versionnées (`/v1/todos`, `/v2/todos`), ce qui a été testé.

**Le cas de `POST /v1/todos`** (qui valide sans enregistrer) : il est protégé quand même. v1 et v2 sont deux versions du même point d'entrée « ajouter un todo ». Avec la même règle d'accès, un client qui passe de v1 à v2 ne découvre pas une nouvelle exigence d'authentification. Pour l'exclure, il suffirait d'écrire :

```ts
consumer.apply(AuthMiddleware)
  .exclude({ path: 'todos', method: RequestMethod.POST, version: '1' })
  .forRoutes(TodosController);
```

**Conséquence :** les lectures (`GET /todos`, `/todos/stats`, `/todos/search`, `/todos/:id`) exigent aussi un token. `GET /` (AppController), `/uuid-test` et les routes Cv/Skill/User ne sont pas concernés.

### 3.4 JWT : `decode` vs `verify`

Un JWT a la forme `header.payload.signature`. Les deux premières parties sont du JSON encodé en base64url, **lisible par tout le monde** (c'est ce qu'affiche jwt.io). La signature est un HMAC-SHA256 de `header.payload` calculé avec le secret du serveur.

- `decode(token)` décode seulement le payload, **sans vérifier la signature**. N'importe qui peut fabriquer un token `{ "userId": 1 }` et se faire passer pour le user 1. C'est inutilisable pour de l'authentification.
- `verify(token, secret)` recalcule la signature avec le secret et la compare. Il vérifie aussi `exp` (l'expiration). Il **lève une exception** si quelque chose ne va pas, et renvoie le payload sinon. C'est pour ça qu'il est dans un `try/catch`.

Le payload est **signé, pas chiffré** : on n'y met jamais de données sensibles, comme un mot de passe.

Le type de retour de `verify` est `string | JwtPayload`, d'où le test `typeof payload === 'string' || typeof payload.userId !== 'number'`.

Les tokens de test sont générés par `npm run tokens` (`jwt.sign` avec le même `JWT_SECRET`, expiration 7 jours). `tokenMauvaisSecret` montre la différence entre les deux fonctions : `decode` l'accepterait, `verify` le refuse.

### 3.5 Le secret dans `.env` : `@nestjs/config`

`ConfigModule.forRoot({ isGlobal: true })` charge `.env` dans `process.env` et rend `ConfigService` injectable partout. `getOrThrow('JWT_SECRET')` échoue clairement si le secret manque, au lieu de signer avec `undefined`. Le `.env` n'est pas commité. `.env.example` sert de modèle.

### 3.6 Typage de la requête

`AuthRequest extends Request` ajoute `userId: number`. Dans le controller : `@Req() req: AuthRequest` puis `req.userId`. L'id est un `number` partout (payload du token, colonne de Todo, `User.id`).

Dans le controller, l'interface est importée avec **`import type`**. Avec `isolatedModules` et `emitDecoratorMetadata`, TypeScript l'exige pour un type utilisé dans un paramètre décoré : une interface n'existe pas à l'exécution et ne peut donc pas servir de métadonnée.

### 3.7 Le créateur du todo

- La colonne `userId` est **nullable**, parce que la table contient déjà des todos du TP1. Une colonne `NOT NULL` sans valeur par défaut ferait échouer `synchronize`. Ça a été testé sur une base du TP1 : l'ancien todo est conservé avec `userId: null`.
- `POST /v2/todos` fait `create({ ...dto, userId })`.
- `checkOwnership(id, userId)` appelle d'abord `findOne`, qui renvoie **404** si le todo n'existe pas, puis lève `ForbiddenException` (**403**) si `todo.userId !== userId`.
- **Choix :** la règle s'applique à `PATCH :id` et `DELETE :id`, et aussi à `DELETE :id/soft` (c'est une suppression) et `PATCH :id/restore` (c'est une modification). Pour `restore`, on cherche avec `withDeleted: true`, sinon un todo soft-deleted serait introuvable.
- **Conséquence :** les anciens todos (`userId = NULL`) ne sont plus modifiables par personne (403). C'est cohérent, puisqu'ils n'ont pas de créateur.

**401 ou 403 ?** 401 veut dire « je ne sais pas qui tu es » : pas de token, ou token invalide. 403 veut dire « je sais qui tu es, mais tu n'as pas le droit ».

---

## 4. Partie 2 — Concepts et choix

### 4.1 `nest g resource`

`nest g resource user --no-spec` génère le module, le controller (CRUD REST), le service, l'entité et les DTO (`Update…Dto` déjà en `PartialType`), et ajoute le module à `AppModule`. Tout le reste a été complété à la main : entités, validation, services, relations.

J'ai utilisé `--no-spec` parce que les `.spec` générés échoueraient sans *mock* du repository (`getRepositoryToken`). Écrire ces tests n'est pas demandé.

### 4.2 Factorisation 1 : `TimestampEntity` (héritage d'entité)

C'est la classe du TP1, simplement **déplacée** dans `src/common/entities/` (avec `git mv`, sans duplication). Todo, User, Cv et Skill en héritent. TypeORM recopie les colonnes `createdAt`, `updatedAt` et `deletedAt` dans chaque table.

- `@CreateDateColumn` / `@UpdateDateColumn` sont remplies automatiquement.
- `@DeleteDateColumn` sert au soft delete. Les `find*` excluent automatiquement les lignes où `deletedAt` n'est pas nul.

### 4.3 Factorisation 2 : `CrudService<T>` (généricité + héritage)

```ts
export abstract class CrudService<T extends HasId> {
  constructor(protected readonly repository: Repository<T>) {}
  findAll() / findOne(id) / create(dto) / update(id, dto) / remove(id)
}

@Injectable()
export class UserService extends CrudService<User> {
  constructor(@InjectRepository(User) repository: Repository<User>) {
    super(repository);
  }
}
```

- **Générique `<T>`** : la même logique fonctionne pour n'importe quelle entité. La contrainte `T extends HasId` garantit que `T` a un `id: number`.
- **`abstract`** : on n'instancie jamais `CrudService` directement. Il n'est d'ailleurs pas `@Injectable`. Seuls les services enfants sont des providers.
- **`protected repository`** : accessible dans les enfants (par exemple `SkillService.findByIds`), mais pas depuis l'extérieur.
- **Le Repository est passé par le constructeur** (`super(repository)`) : chaque enfant reçoit le sien par injection de dépendances.
- C'est le principe **DRY** et l'esprit du pattern **Template Method** : le parent définit l'algorithme commun, et un enfant peut redéfinir une étape (`CvService`).

Quelques détails du CRUD générique :

- `findOne` renvoie **404** avec le nom de l'entité (`repository.metadata.targetName`, par exemple `Cv`). Le cast `{ id } as FindOptionsWhere<T>` est nécessaire, car TypeScript ne peut pas prouver qu'un filtre `{ id }` convient à un `T` générique.
- `update` utilise **`preload({ ...dto, id })`**, qui charge l'entité existante et fusionne le DTO dedans. Il renvoie `undefined` si l'id n'existe pas, d'où le 404. Ensuite vient `save`.
- `create` et `update` **relisent l'entité avec `findOne`** après le `save`. Deux raisons : la réponse contient les relations eager complètes, et elle ne contient **jamais le password**. En effet, l'objet passé à `save` contient le mot de passe envoyé par le client, alors qu'une relecture respecte `select: false`.
- `remove` utilise `findOne` (404), puis `delete` (suppression **définitive**). C'est voulu : `onDelete: 'CASCADE'` est une contrainte SQL, qui ne se déclenche que sur un vrai `DELETE`, pas sur un soft delete.
- `notFound(id)` factorise le message d'erreur.

### 4.4 `CvService` : redéfinition (override) + `super`

`CreateCvDto` contient `userId` et `skillIds`, qui ne sont **pas** des colonnes de `Cv`. TypeORM a besoin des entités. `create` et `update` sont donc redéfinies :

```ts
async create(dto: CreateCvDto) {
  const { userId, skillIds, ...cvData } = dto;
  const relations = await this.loadRelations(userId, skillIds);
  return super.create({ ...cvData, ...relations });
}
```

`loadRelations` ne convertit que ce qui est fourni :

- `userId` → `userService.findOne(userId)`, qui renvoie 404 si l'id est inconnu.
- `skillIds` → `skillService.findByIds(skillIds)` : `findBy({ id: In(ids) })`, puis **404 qui liste les ids manquants**. Sans ce contrôle, `In()` ignorerait en silence un id inexistant.
- En update, ne pas envoyer `skillIds` laisse les skills inchangés, et envoyer `[]` les retire tous.

CvService utilise **UserService et SkillService plutôt que leurs repositories** : on réutilise leur logique, y compris le 404. Pour ça, `UserModule` et `SkillModule` mettent leur service dans `exports`, et `CvModule` les importe.

### 4.5 Les relations TypeORM

```
User 1 ───── * Cv * ───── * Skill
```

**User 1 ─── * Cv**

- Côté Cv : `@ManyToOne(() => User, (user) => user.cvs, { eager: true, onDelete: 'CASCADE' })`. Le côté `ManyToOne` **porte la clé étrangère** : la table `cvs` a une colonne `userId`.
- Côté User : `@OneToMany(() => Cv, (cv) => cv.user)`. C'est le côté inverse, **sans colonne** en base. Le deuxième argument relie les deux côtés.

**Cv * ─── * Skill**

- Côté Cv : `@ManyToMany(() => Skill, { eager: true })` + `@JoinTable()`.
- Une relation N-N ne peut pas se stocker avec une simple clé étrangère. Il faut une **table de jointure** : `cvs_skills_skills (cvsId, skillsId)`.
- `@JoinTable()` se met sur **un seul côté**, le côté **propriétaire**. C'est lui qui crée la table et qui l'écrit quand on fait `save` d'un Cv.
- La relation est **unidirectionnelle** : `Skill` ne déclare pas `cvs`, puisqu'on n'a pas besoin de lister les cvs d'un skill. On pourrait l'ajouter (`@ManyToMany(() => Cv, (cv) => cv.skills)`) sans `@JoinTable`.

Schéma SQL réellement généré :

```sql
CREATE TABLE "cvs" (..., "userId" integer,
  FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE)
CREATE TABLE "cvs_skills_skills" ("cvsId" integer, "skillsId" integer,
  FOREIGN KEY ("cvsId")    REFERENCES "cvs"    ("id") ON DELETE CASCADE,
  FOREIGN KEY ("skillsId") REFERENCES "skills" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("cvsId", "skillsId"))
```

### 4.6 `eager`, `cascade`, `onDelete` : trois choses différentes

| Option | Niveau | Signification | Choix |
|---|---|---|---|
| `eager: true` | TypeORM (lecture) | La relation est chargée automatiquement à chaque `find*` | Oui sur `Cv.user` et `Cv.skills` : on affiche toujours un cv avec son propriétaire et ses compétences |
| `cascade` | TypeORM (écriture) | `save(cv)` insère ou met à jour aussi les entités liées passées dans l'objet | **Non** : on lie des skills et un user **existants** par leurs ids. Avec `cascade`, un client pourrait créer ou modifier des skills en passant par `/cv` |
| `onDelete` | Base de données (contrainte FK) | Ce que fait le SGBD quand la ligne référencée est supprimée | `'CASCADE'` sur `Cv.user` : un cv n'a pas de sens sans son propriétaire. Supprimer un user supprime ses cvs |

À savoir sur ces options :

- **`eager` sur un seul côté.** `User.cvs` n'est pas eager : sinon chaque lecture d'un user chargerait tous ses cvs. Et TypeORM **interdit les relations eager circulaires** (les deux côtés en eager provoquent une erreur).
- **`eager` ne marche qu'avec `find*`.** Avec `createQueryBuilder`, il faut faire `leftJoinAndSelect` soi-même.
- **La table de jointure a `ON DELETE CASCADE` par défaut.** Supprimer un skill retire seulement les lignes de liaison, pas les cvs. Ça a été testé : après `DELETE /skill/3`, le cv 1 a `skills: []`.
- **`cascade` et `onDelete` ne se ressemblent que par le nom.** `cascade` est géré par TypeORM, en JavaScript, au moment du `save`. `onDelete` est une règle SQL, appliquée par la base même si on supprime la ligne en SQL pur.
- **Tests de la cascade.** `DELETE /user/2` a bien supprimé les cvs 1 et 2. SQLite exige `PRAGMA foreign_keys = ON` pour appliquer les clés étrangères, et le driver TypeORM l'active.

### 4.7 Ne jamais renvoyer le password : `select: false`

`@Column({ select: false })` exclut la colonne de **toutes** les lectures `find*`, **y compris** quand le user est chargé en eager dans un cv. Elle est toujours écrite normalement en base, ce qui a été vérifié.

J'ai préféré cette solution à `@Exclude()` + `ClassSerializerInterceptor` (class-transformer). Avec `select: false`, le password ne quitte même pas la base. Il n'y a rien à oublier, comme un intercepteur non branché ou un objet brut non transformé en instance de classe.

**À prévoir pour la partie 4 (login) :** le login devra **sélectionner explicitement** le password pour le comparer, par exemple :

```ts
this.repository.findOne({
  where: { username },
  select: { id: true, username: true, email: true, password: true },
});
// ou : createQueryBuilder('user').addSelect('user.password').where(...)
```

**Limites actuelles, traitées par les parties suivantes :**

- Le password est stocké **en clair** : bcrypt arrive à la partie 4.
- `username` et `email` ne sont pas encore `unique` : c'est aussi la partie 4.
- Les routes Cv, Skill et User ne sont pas protégées, puisque l'énoncé ne demande le middleware que pour Todo.

### 4.8 Validation des DTO

Le `ValidationPipe` global du TP1 est réutilisé (`main.ts`) :

- `whitelist: true` supprime les propriétés non décorées.
- `forbidNonWhitelisted: true` renvoie **400** si le client envoie une propriété inconnue (testé avec `"role": "admin"`).
- `transform: true` transforme le body en instance du DTO.

Règles par entité :

- **User** : `username` (`@IsString`, `@IsNotEmpty`), `email` (`@IsEmail`), `password` (`@MinLength(6)`).
- **Skill** : `designation` (`@IsString`, `@IsNotEmpty`).
- **Cv** :
  - `name`, `firstname`, `job` non vides ;
  - `age` en `@IsInt` + `@Min(0)` ;
  - `cin` en `@Matches(/^\d{8}$/)` : 8 chiffres, stocké en **chaîne** car un CIN peut commencer par 0 ;
  - `path` en `@IsOptional` ;
  - `userId` en `@IsOptional` + `@IsInt` ;
  - `skillIds` en `@IsOptional` + `@IsArray` + `@IsInt({ each: true })`.
- `Update…Dto = PartialType(Create…Dto)` (`@nestjs/mapped-types`) : mêmes validateurs, mais chaque champ devient optionnel.
- `ParseIntPipe` sur `:id` : `/cv/abc` renvoie **400** au lieu d'envoyer `NaN` à la base.

### 4.9 Imports relatifs uniquement

Tous les imports sont relatifs (`../common/...`, jamais `src/...`). Vérifié avec `grep -rn "from 'src/" src`, qui ne trouve rien.

**Pourquoi c'est important :** `tsconfig.json` a `baseUrl: "./"`. `tsc` compile donc `import ... from 'src/...'`, mais à l'exécution **Node ne connaît pas `baseUrl`**. Le seed lancé avec `ts-node` (partie suivante) planterait avec « Cannot find module 'src/...' », sauf à ajouter `tsconfig-paths`.

---

## 5. Points à bien connaître pour l'oral

1. Le refactor `DataSource` → `TodosService` + `Repository` n'a changé aucune route ni aucune réponse. Les 22 réponses avant et après ont été comparées.
2. `forRoutes(TodosController)` protège **tout** le controller, y compris `POST /v1/todos` (même point d'entrée en deux versions, même règle d'accès) et les `GET`. On peut retirer une route avec `exclude`.
3. La règle du créateur s'applique aussi au soft delete et au restore. `restore` cherche avec `withDeleted: true`.
4. Les anciens todos (`userId = NULL`) renvoient 403 pour tout le monde.
5. `@nestjs/config` a été ajouté, car le projet ne chargeait pas `.env`.
6. `import type` est utilisé pour `AuthRequest`, à cause de `isolatedModules` et `emitDecoratorMetadata`.
7. `next()` est appelé hors du `try/catch` du middleware.
8. `create` et `update` relisent l'entité, pour les relations eager et pour ne pas renvoyer le password.
9. `remove` fait un vrai `DELETE`, pas un soft delete : sinon `onDelete: 'CASCADE'` ne se déclencherait pas.
10. Le password est en `select: false`. Le login de la partie 4 devra le sélectionner explicitement. Il est en clair pour l'instant.

---

## 6. Questions probables du prof (et réponses)

**Q1. Quelle différence entre un middleware et un guard ? Pourquoi un middleware ici ?**
Le middleware s'exécute en premier dans le cycle de vie : middleware → guards → intercepteurs → pipes → handler. C'est du pur Express. Il n'a pas accès à l'`ExecutionContext`, donc il ne sait pas quel handler va être appelé et ne peut pas lire de métadonnées comme `@Roles()`. Un guard renvoie `true` ou `false` et connaît le handler : c'est l'outil Nest prévu pour l'autorisation. L'énoncé demande explicitement un middleware ici. Les guards arrivent dans les parties suivantes.

**Q2. Comment le middleware est-il appliqué ? Pourquoi pas dans `@Module` ?**
Le décorateur `@Module` n'a pas de propriété pour les middlewares. Le module implémente `NestModule` et sa méthode `configure(consumer)` : `consumer.apply(AuthMiddleware).forRoutes(TodosController)`.

**Q3. Pourquoi `res.json` et pas `throw new UnauthorizedException()` ?**
L'énoncé demande de répondre avec `res.json`. Les deux marchent : Nest attrape aussi une `HttpException` levée dans un middleware. Avec `res.status(401).json(...)`, on termine la réponse soi-même et on n'appelle pas `next()`. J'ai gardé le même format que les erreurs Nest (`statusCode`, `message`, `error`).

**Q4. Que se passe-t-il si on oublie `next()` ?**
La requête reste bloquée, sans réponse, jusqu'au timeout du client. Il faut soit appeler `next()`, soit envoyer une réponse.

**Q5. Différence entre `decode` et `verify` ?**
`decode` lit le payload sans vérifier la signature : n'importe qui peut forger un token. `verify` vérifie la signature avec le secret, ainsi que l'expiration, et lève une exception sinon. Seul `verify` authentifie.

**Q6. Le contenu d'un JWT est-il secret ?**
Non. Il est encodé en base64url, pas chiffré : jwt.io le lit sans le secret. La signature garantit seulement qu'il n'a pas été **modifié**. On n'y met donc jamais de données sensibles.

**Q7. Où est stocké le secret ? Pourquoi pas dans le code ?**
Dans `.env`, lu par `ConfigService`, et non commité. Un secret dans le code finit sur GitHub, et avec lui n'importe qui peut signer des tokens valides. `.env.example` documente les variables attendues.

**Q8. Comment le controller récupère-t-il le `userId` ?**
Le middleware l'a ajouté à l'objet `req`. Le controller le lit avec `@Req() req: AuthRequest`. `AuthRequest` est une interface qui étend `Request` d'Express avec `userId: number`, pour garder un typage propre.

**Q9. Pourquoi 404 avant 403 ?**
On ne peut pas dire qui est le créateur d'un todo qui n'existe pas. `checkOwnership` appelle d'abord `findOne` (404), puis compare les `userId` (403).

**Q10. Pourquoi `userId` est-il nullable dans Todo ?**
La table contient déjà des todos du TP1, qui n'ont pas de créateur. Avec `synchronize`, une colonne `NOT NULL` sans valeur par défaut ne pourrait pas être ajoutée sur ces lignes.

**Q11. Pourquoi avoir créé `TodosService` ?**
Pour séparer les responsabilités : le controller gère le HTTP, le service la logique et les données. On a ainsi pu utiliser la méthode du cours (`forFeature` + `@InjectRepository`), réutiliser `findOne` dans `checkOwnership`, et faciliter les tests.

**Q12. `forFeature` vs `forRoot` ?**
`forRoot` (une seule fois, dans `AppModule`) configure la connexion à la base : type, fichier, entités, `synchronize`. `forFeature([Entité])` (dans chaque module) enregistre les repositories de ces entités dans le module, pour qu'on puisse les injecter avec `@InjectRepository`.

**Q13. Où est la clé étrangère dans User–Cv ? Pourquoi ?**
Dans `cvs.userId`, côté `@ManyToOne`. Chaque cv a **un** user : une colonne suffit. Côté user, on ne pourrait pas stocker une liste dans une colonne. `@OneToMany` est donc seulement le côté inverse, sans colonne.

**Q14. À quoi sert `@JoinTable` ? Peut-on le mettre des deux côtés ?**
Il crée la table de jointure `cvs_skills_skills` et désigne le côté propriétaire de la relation N-N, celui qui écrit dans cette table lors d'un `save`. On le met sur **un seul** côté : la relation n'a qu'une table de jointure et un seul propriétaire. Des deux côtés, chacun se croirait propriétaire de la relation.

**Q15. Différence entre `cascade` et `onDelete: 'CASCADE'` ?**
`cascade` est une option TypeORM : au `save`, il insère ou met à jour aussi les entités liées. `onDelete: 'CASCADE'` est une contrainte SQL sur la clé étrangère : quand la base supprime la ligne référencée, elle supprime les lignes qui la référencent. Ici, il n'y a pas de `cascade`, puisqu'on lie des entités existantes par leurs ids. Il y a `onDelete: 'CASCADE'` sur `Cv.user`.

**Q16. Pourquoi pas `eager` sur `User.cvs` aussi ?**
TypeORM interdit les relations eager des deux côtés (relation circulaire). Et ce serait coûteux : chaque lecture d'un user chargerait tous ses cvs. Si on en a besoin, on demande `find({ relations: { cvs: true } })` au cas par cas.

**Q17. `eager` fonctionne-t-il avec `createQueryBuilder` ?**
Non, seulement avec les méthodes `find*`. Avec le QueryBuilder, on écrit soi-même `leftJoinAndSelect('cv.user', 'user')`.

**Q18. Que se passe-t-il si on supprime un skill utilisé par un cv ? Et un user ?**
Pour un skill, la table de jointure a `ON DELETE CASCADE` par défaut : seules les lignes de liaison disparaissent, le cv reste avec un skill de moins. Pour un user, `onDelete: 'CASCADE'` sur `Cv.user` : ses cvs sont supprimés. Les deux cas sont testés dans `requests.http`.

**Q19. Comment fonctionne le `CrudService` générique ?**
C'est une classe abstraite paramétrée par `T extends HasId`, qui reçoit un `Repository<T>` dans son constructeur. Chaque service fait `extends CrudService<Entité>`, reçoit son repository par `@InjectRepository` et le passe avec `super(repository)`. Les 5 méthodes du CRUD sont écrites une seule fois.

**Q20. Pourquoi `CrudService` n'est-il pas `@Injectable` ?**
On ne l'injecte jamais directement : il est `abstract`, donc pas instanciable. Ce sont ses enfants (`UserService`…) qui sont des providers `@Injectable`.

**Q21. Pourquoi `CvService` redéfinit-il `create` et `update` ?**
Le DTO contient `userId` et `skillIds`, alors que l'entité attend un objet `User` et un tableau de `Skill`. La redéfinition convertit les ids en entités (404 si l'un n'existe pas), puis délègue au parent avec `super.create()` / `super.update()`. On ne réécrit pas le CRUD.

**Q22. Pourquoi `findByIds` vérifie-t-il les ids manquants ?**
`findBy({ id: In([1, 999]) })` renvoie seulement le skill 1, **sans erreur**. Sans ce contrôle, on enregistrerait un cv avec moins de skills que demandé, sans prévenir le client.

**Q23. Pourquoi `preload` dans `update` ?**
`preload` charge l'entité existante et fusionne le DTO dedans en une seule opération. Il renvoie `undefined` si l'id n'existe pas (d'où le 404). Ensuite, `save` met à jour aussi les relations, par exemple les skills de la table de jointure, ce que `repository.update()` ne sait pas faire pour une relation N-N.

**Q24. Comment être sûr que le password n'est jamais renvoyé ?**
Avec `@Column({ select: false })`, aucune lecture `find*` ne le récupère, même en eager dans un cv. Et `create`/`update` relisent l'entité au lieu de renvoyer l'objet sauvegardé, qui contient le password envoyé par le client. C'est testé dans `requests.http` : aucune réponse ne contient sa valeur.

**Q25. Et pour le login, comment lire le password ?**
On le demande explicitement : `findOne({ where: { username }, select: { ..., password: true } })` ou `createQueryBuilder('user').addSelect('user.password')`. Puis on compare avec `bcrypt.compare` (partie 4).

**Q26. À quoi sert `PartialType` ?**
`UpdateCvDto extends PartialType(CreateCvDto)` reprend tous les champs **et leurs validateurs**, mais les rend optionnels. Un PATCH peut donc n'envoyer qu'un champ, et on n'écrit pas les règles deux fois.

**Q27. Que font `whitelist` et `forbidNonWhitelisted` ?**
`whitelist` supprime du body les propriétés sans décorateur de validation. `forbidNonWhitelisted` renvoie 400 à la place, ce qui empêche par exemple un client d'envoyer `"role": "admin"`.

**Q28. Pourquoi des imports relatifs ?**
`tsc` résout `src/...` grâce à `baseUrl`, mais Node, à l'exécution, ne le connaît pas. Le seed lancé avec `ts-node` échouerait avec « Cannot find module ». Les imports relatifs marchent partout.

**Q29. Pourquoi `cin` est-il une chaîne ?**
C'est un identifiant, pas une quantité : on ne fait pas de calcul dessus, et un CIN peut commencer par 0 (`01234567` deviendrait `1234567` en nombre). Il est validé par l'expression régulière `^\d{8}$`.

**Q30. Que donne `TimestampEntity` ? Pourquoi l'avoir déplacé ?**
`createdAt`, `updatedAt` (automatiques) et `deletedAt` (soft delete) sont ajoutés par héritage à chaque entité. Il était dans `todos/entities` mais sert maintenant aux 4 entités : sa place est dans `common`. Il a été déplacé, pas copié, pour éviter la duplication.
