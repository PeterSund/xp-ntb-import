# NTB Import

Enonic XP Application that imports articles from [NTB Kommunikasjon](https://kommunikasjon.ntb.no/) and creates `Content` in XP.

| :information_source: You need to have a subscription from [NTB Kommunikasjon](https://kommunikasjon.ntb.no/bli-kunde) to use this library. |
|------|

[![](https://jitpack.io/v/no.item/xp-ntb-import.svg)](https://jitpack.io/#no.item/xp-ntb-import)

<img src="https://github.com/ItemConsulting/xp-ntb-import/raw/main/docs/icon.svg?sanitize=true" width="150">

## Installation

Install this application from Enonic Market.

## Usage

### Configuration

When you add the NTB Import application to your *site*, you have to configure four fields.

 1. Folder where articles are stored
 2. Publisher id (8 digit number from NTB)
 3. Channels (8 digit number from NTB)
 4. Fetch all articles (Will fetch all articles every hour, so make sure you actually need it before checking it)

### Manual Article Import

You can manually run an import by running the  `ntb-import` service, which can be found on the following url-path: 
*/_/service/no.item.ntb/ntb-import*

### Automatic Article Import

The application has a [cron job](./src/main/resources/main.ts) that runs an import job **every hour on the hour**. If there 
are new articles on your NTB Channel, they will be imported into XP as 
[NTB Article](./src/main/resources/site/content-types/ntb-article/ntb-article.xml) content. The  **su** user is set as 
the owner of the new content.

### Displaying NTB Article

You have to write the code generate the HTML based on the `NTB Article` in your own application.

If you are using [TypeScript](https://github.com/ItemConsulting/enonic-types/), you can use 
[this interface](./src/main/resources/site/content-types/ntb-article/ntb-article.d.ts) to interact with the objects created by this library.

```typescript
export interface NtbArticle {
  title: string;
  leadtext: string;
  body: string;
  imageId?: string;
  images?: Array<string>;
  links?: Array<{
    url: string;
    description: string;
  }>;
  keywords?: Array<string>;
  ntbId: number;
  published: string;
  url: string;
  type: string;
  publisherId: number;
  channelId: number;
  language: string;
}
```

## Deploying

### Building

To build he project run the following code

```bash
enonic project build
```

### Deploy locally

Deploy locally for testing purposes:

```bash
./gradlew publishToMavenLocal
```

## Deploy to Jitpack

Go to the [Jitpack page for xp-ntb-import](https://jitpack.io/#no.item/xp-ntb-import) to deploy from Github.
