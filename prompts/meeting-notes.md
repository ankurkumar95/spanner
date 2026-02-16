# Spanner — Meeting Notes & Prompts

> Log your meeting discussions here. I'll help refine these into actionable prompts when you're ready to implement.

---

## How to Use This File

1. **Log raw notes** — Paste or type what was discussed in the meeting (bullet points, rough notes, screenshots-as-text).
2. **Refine later** — Share this file and ask me to turn the notes into structured prompts (stored in `prompts-refined.md`).
3. **Track version** — Add dates/session labels so we know which discussion each block came from.

---

## Meeting Notes

### Session 1 — [Add date]
As a requirement, create the markdown files and the mermaid files for the project, which we are going to discuss here.
We need to create a user registration, login, forward password modules into that.
We have to create m multiple modules in the project and each module can be accessed by a certain user group. So take note of that.
Technical architecture create the mermaid files and the markdown files.
The per purpose of this application is to support the sales and marketing processes. We want to create a centralized application where the planning can happen, and since we are an IT company, our target audience, we call them, we decide on the basis of the segments. So s I believe the segments are the key data point around which all the modules will resolve revolve. So make note of that.
A segment will be created by the top management or the sales processes owner. So they will create the segment in that the fields are like segment name, its description, and the offerings we want to give. So offerings field we want to keep it flexible so that for each segment we can add or delete the offerings as and when required. So it should be like a chosen auto-complete field type, so that if a particular offering is already there in the fee in the database, then it should show as autocomplete, and if not, then we can add there.
Once the segment is created, we need to assign it to a certain SDR. SDR are like sales development representative for you know better. So that would be the process.I think assigning a segment to an SDR should be treated as a separate module as well. So this can be done at assignment to the SDR can be done at the time of creating the segment, as well as in the from the list view, we can assign the segment to certain SDR.
We have to create a list view of the segments, which is visible, all the segments are visible, read only visibility to all type of users.
Do remember for from the technical perspective I want everything to be in the Docker containers. So that we should have a separate Docker container for database and we want to use API based system, so we want I want to use Python based fast API and for front end, you can suggest me anything.
<!-- Add your meeting notes below -->

Types of Users
Segment Owner
Company Researcher/Contact Research
Approver 
SDR
Marketing

Following are the fields which shall be uploaded by the researcher in sheets.

	First Name	Last Name	Mobile Phone	Job Title	Company Name	Email	Company Address 1: Street 1	Company Address 1: State/Province	Company Address 1: ZIP/Postal Code	Company Address 1: Country/Region	Company Address 1: City	Direct Phone Number	Email Address 2	Email Active Status	Lead Source Global	Management Level	Contact Address 1: Street 1	Contact Address 1: City	Contact Address 1: State/Province	Contact Address 1: Country/Region	Contact Address 1: ZIP/Postal Code	Primary Time Zone	Contact Linkedin Url	LinkedIn Summary	Researcher Name	Data Requester Details 	Company Website	Company Phone	Company Description	Company Linkedin Url	Company Industry	Company Sub-Industry	Segment Name	Founded Year	Company Revenue Range	Company Employee Size Range



 So this is how the process will look like. First we will find and decide on the segments, to which segments we want to target.
 Based on the segment, the researcher will find the company names from various sources like LinkedIn or some other sources.
 Once the sources are identified, these sources will be approved by the SDR so that they can.
 Once the sources are approved, the companies are approved, these the when once the these companies are approved by the SDR, then the the approved list will be sent back to the researcher and the researchers will find the contacts of the companies.
 Once the contacts are identified, these will be sent to the SDRs to set up the meetings for code calling or sending marketing collateral or anything tool they want to use.
 For each segment, based on the offerings, the marketing team will create the the colliterals, the pamphlets, or other marketing material they want to send to for a particular segment.
 Once a meeting is fixed by by the SDR or anyone else, the marketing team will create a specialized marketing content for that specific lead.
 Each segment can be assigned to multiple researchers, so we should have that kind of feature.
 Since researchers will generate a lot of data, they will upload the data. We need to create a module to upload the predefined format of CSV. Okay.
 While creating the module, we should first test that Cs the the uploaded CSV has the required fields.
 It is quite possible that researchers may end up uploading the duplicate records. It's fine, we can accept the duplicate records, but to filter out the duplicate record, we should create a scheduled job in which we can say that this record flag the duplicate so that we can flag the duplicate records automatically based on certain fields. We can discuss this when we review the requirements.

 So we have to create a segment. Based on the segment we will find the companies, once the companies list is approved, the researchers will work on the approved company list to find the contacts. Once the contacts are identified, these will be reviewed by the SDRs and SDRs will then set up the calls with them.

Approver is one of the researcher but with the  Experience.So he will be doing its own research and doing the approval and the assignment of the task to the junior folks.

I want to create the mock-ups of the UI design. Can you suggest me the AI tool which I can use?

We have to create file upload modules in the application. I hope you have mentioned those in the technical architecture and the product requirements. If not, please check.

I'm done with the recalling of the meeting yesterday. Can you based on the requirements if you have any open questions for me I would be happy to answer.

Please put the questions in a markdown file, I will review there and put my answers over there.  Leave a response markup over there so that I will put my response in that section.

I have updated the answers to the open questions, please refer.

Now, lets review whatever we did using opus4.6

Please put all your questions, whatever you want, feedback from me into that.

Before responding to your questions, based on the requirements we have figured out so far, do you have any standard processes around these requirements? I'm sure we are not thinking anything unique so far. So based on your knowledge, can you suggest to me what are the best workflows which fits in in these requirements?

This looks good to me. So for now why don't we just update the requirements and prompts created and I can review the requirements once again.


Now, you are an Experienced Product Manager, please review the requirements we have collected so far, find any gaps if you see. Ask me questions if you have have.

¸
   Let's create separate files, markdown files for For architectural design, flow diagrams, box diagrams, mermaid files, technical architectural design, architectural diagrams, technical designs, first And the database design as well.

   Based on the exercise we did so far, I want to give a cool name to this project. To create the repositories, logos and everything. So can you suggest me a name around that?

   I want to go with the name of Spanner. Please update all the documents and requirement of whatever documents you have generated everywhere, including the mini CRM folder name.

   I want to use Google Stitch to create the mock-ups, workflows, design, everything of the application. Can you give me a correct prompt so that it can create the the right screens for all the project to requirements we discussed so far? I want to supply the Google the Docs folder, you have created all the markdown files within the docs folder. So give me appropriate prompt so that I I can give it to the streets and it can create all the things in one go.


   Yes, you have missed many logical screens like forgot password, reset password. Forms for adding contacts, segments and companies.

   I don't know but can Stitch validate what it has created? So it seems like a lot of screens are missing in the design stitch has created. Can you please update g give me a relevant prompt for that?

   I want to develop this application using Google Tools, so give me a appropriate prompt so that this duffer can understand what to do in one bow.

   Whatever you have written in Google Dev Prompt, sh should I give in one go or I can split it into multiple tasks?

   I don't think you under get this right. So I want to use the full capabilities of Jules. So give me suggest to me first that can this project be split into multiple agents so that multiple agents can work in parallel and s g give me the right prompts if possible.

   Give me a list of designs I have in my Stitch account.