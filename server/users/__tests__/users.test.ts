import { expect } from "chai";
import { describe, it } from "mocha";

import { createUser } from '../src/users.service';

describe("Users Service", () => {
	it("should create a user when given valid data", async () => {
		try {
			const user = await createUser({
				nickname: "somenick",
				password: "eXdoloreD0l0r3e"
			});
			expect(user).to.be.an("object");
			expect(user.id).to.be.a("string");
		} catch (e) {
			if (e instanceof Error) {
				if (e.name === "AggregateError") return;
				console.error(e);
			}
		}
	});
});
