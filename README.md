## Batch and bulk processing

[db/batch](https://github.com/leosbotelho/node-prelude-1/blob/main/db/batch.mjs) and [db/bcp](https://github.com/leosbotelho/node-prelude-1/blob/main/db/bcp.mjs) showcase batch primitives.

<br>

[db/bcp](https://github.com/leosbotelho/node-prelude-1/blob/main/db/bcp.mjs) is faster, but not 'order of magnitude faster';  
&nbsp; nor operates with the transaction log disabled or - acutely - curtailed.  
So it's just faster batch processing.  
&nbsp; That's what's possible with - mariadb - innodb.

<br>

cf
great basis for `bcp` primitives:
1. Db2 `not logged initially`  
&nbsp; lets you disable the transaction log while keeping all other - SQL - facilities
2. Sybase `bcp` cli (esp `fast bcp`)

Ideally, we'd have both, in the same db.  
And maybe even:  
3. the possibility to - alter database files directly

<br>

I pass `batch` params to procs through `Memory` tables.  

<br>

For variadic fields (eg `varchar(n)`) that means an `n * k` allocation (eg `4n` for `utf8mb4`).  
In some cases, I try to amortize this inefficiency, limitation by using myisam '`Ramdisk`' tables.

<br>

- I also thought about building a `BTree` on a bigger proc param (eg `longtext`); and have `udfs` manipulate it; but besides being very involved, also has it's own inneficiencies, [eg](https://gist.github.com/leosbotelho/1759e60eac8d8175825e09546eddb4d0).

<br>

[chunk](https://github.com/leosbotelho/node-prelude-1/blob/main/chunk.mjs) and [async](https://github.com/leosbotelho/node-prelude-1/blob/main/async.mjs) primary purpose is supporting batch processing.

## db

[db/conn](https://github.com/leosbotelho/node-prelude-1/blob/main/db/conn.mjs) is my driver wrapper with logging, retry, reconnect and other shenanigans. 

<br>

[db/exc](https://github.com/leosbotelho/node-prelude-1/blob/main/db/exc.mjs) highlight is [`DmlSemSqlCode`](https://github.com/leosbotelho/node-prelude-1/blob/main/db/exc.mjs#L5) ([cf](https://gist.github.com/leosbotelho/940cc5961f1beba362621e6386dd4b3e#file-db2-err-diff-eg-pl)).

<br>

[db/proc](https://github.com/leosbotelho/node-prelude-1/blob/main/db/proc.mjs) is the pl side of stored procs.

## hash

I like truncating `md5` to a `64 bit unsigned int`.  
&nbsp; I want uniqueness and 64 bits is often enough.
- [blake3](https://github.com/BLAKE3-team/BLAKE3) is amazing and even better,  
&nbsp; but I'm yet to write the udf and adapt my systems to it.

As in [1](https://github.com/leosbotelho/node-prelude-1/blob/main/hash.mjs#L10) and [2](https://gist.github.com/leosbotelho/c8c57d7dfc3a8509ef3659349a779766#file-md5-u64-fn-sql).

## bp
boilerplate

I write my mains as:
```
import { main, BB } from "../bp.mjs"

const ProgName = progName(import.meta.url)

main({ ProgName, db: { BB } }, async ({ bbc, L, log }) => {
  // ...
})
```

[bp](https://github.com/leosbotelho/node-prelude-1/blob/main/bp.mjs) gives me the requested database connections and loggers; and handles a lot of repetitive stuff, overall.  
And say I want a larger [sort_buffer_size](https://gist.github.com/leosbotelho/45ff8cf194e534c378da5915e1cbe08b?permalink_comment_id=4281476#gistcomment-4281476), then - instead of importing BB:
```
const BB = {
  initCmd: "set sort_buffer_size=10*1024*1024"
}
```

<br>

The 'elusive' [withL](https://github.com/leosbotelho/node-prelude-1/blob/main/bp.mjs#L71)  basically prepends strings to the loggers corresponding to the returned objects:
```
const [bbc_, log_, L_] = withL(bbc, ["prepended"], L)
```

It's a way to give logs some context, eg for `Promise.all`.

## ras
Resilience and serviceability

I cherish [cockatiel](https://github.com/connor4312/cockatiel) and, by extension, [Polly](https://github.com/App-vNext/Polly).

### [db](https://github.com/leosbotelho/node-prelude-1/blob/main/ras.mjs#L35)

_There's a world of difference between programs that retry database operations and those that don't._

### [got](https://github.com/leosbotelho/node-prelude-1/blob/main/ras.mjs#L80)

I might extend [sindresorhus/got](https://github.com/sindresorhus/got) like [this](https://gist.github.com/leosbotelho/6cc69aec616ea6646535aaa62f304ef9).
